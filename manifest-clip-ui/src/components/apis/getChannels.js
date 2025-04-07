import { GET_CHANNELS_API } from '../../config'

export function getChannelsAPI() {
  console.log('get Channels', GET_CHANNELS_API)
  const url = `${GET_CHANNELS_API}`
  return fetch(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json'
    })
  })
    .then((data) => {
      console.log(data)
      return data.json()
    })
    .catch((error) => {
      console.error('Error', error)
      return error
    })
}