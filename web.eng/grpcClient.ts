import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { ClobClient } from './gen/clob.client'
import { ApiServiceClient } from './gen/api.client'

const transport = new GrpcWebFetchTransport({
  // baseUrl: 'http://127.0.0.1:8080',
  baseUrl: '/'
})
const clobClient = new ClobClient(transport)
const apiClient = new ApiServiceClient(transport)

export {
  clobClient,
  apiClient
}
