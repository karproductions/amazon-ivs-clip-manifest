// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const s3Client = new S3Client({ region: process.env.AWS_REGION })

exports.handler = async (event, context) => {
  console.log('Initializing Function Get S3 Recordings')
  const accountID = process.env.ACCOUNT_ID
  const cfURL = process.env.CLOUDFRONT_DOMAIN_NAME

  async function listPrefixes(bucket, prefix) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: '/'
    })
  
    const { CommonPrefixes = [] } = await s3Client.send(command)
    console.log(`[ListPrefixes] Found ${CommonPrefixes.length} prefixes under: ${prefix}`)
    return CommonPrefixes.map(cp => cp.Prefix)
  }
  
  async function getRecordings(channelFilter, dateFilter) {
    if (!channelFilter || !dateFilter) {
      console.error('Both channelFilter and dateFilter are required')
      return []
    }
  
    const [year, monthRaw, dayRaw] = dateFilter.split('-')
    const month = String(parseInt(monthRaw, 10))
    const day = String(parseInt(dayRaw, 10))
  
    const basePrefix = `ivs/v1/${accountID}/${channelFilter}/${year}/${month}/${day}/`
    const bucket = process.env.STORAGE_IVSRECORDINGS_BUCKETNAME
    const vodData = []
  
    try {
      const hourPrefixes = await listPrefixes(bucket, basePrefix)
  
      for (const hourPrefix of hourPrefixes) {
        const minutePrefixes = await listPrefixes(bucket, hourPrefix)
  
        for (const minutePrefix of minutePrefixes) {
          const recordingPrefixes = await listPrefixes(bucket, minutePrefix)
  
          for (const recordingPrefix of recordingPrefixes) {
            const command = new ListObjectsV2Command({
              Bucket: bucket,
              Prefix: recordingPrefix + "media/hls/master.m3u8",
            })
  
            const { Contents = [] } = await s3Client.send(command)
            const masterFile = Contents.find(({ Key }) => Key.endsWith('/master.m3u8'))
  
            if (masterFile) {
              const segments = masterFile.Key.split('/')
              const [ , , , channel, year, month, day, hour, minute, recordingId ] = segments
  
              vodData.push({
                channel,
                year,
                month,
                day,
                hour,
                minute,
                recording: recordingId,
                assetID: `Channel: ${channel} - Date: ${year}-${month}-${day} ${hour}:${minute} - ID: ${recordingId}`,
                path: segments.slice(0, -1).join('/'),
                master: `${cfURL}/${masterFile.Key}`
              })
  
              console.log('Found master manifest at:', masterFile.Key)
            }
          }
        }
      }
  
      return vodData
  
    } catch (error) {
      console.error('Error fetching recordings:', error)
      return []
    }
  }

  const channelFilter = event.queryStringParameters?.channel
  const dateFilter = event.queryStringParameters?.date
  const vodData = await getRecordings(channelFilter, dateFilter)
  console.log('Total recordings found:', vodData.length)

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify(vodData)
  }
  return response
}
