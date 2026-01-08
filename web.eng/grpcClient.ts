import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { ClobPublicClient } from './gen/clob.client.ts'
import { ApiServiceClient } from './gen/api.client'

const transport = new GrpcWebFetchTransport({
  // baseUrl: 'http://127.0.0.1:8080',
  baseUrl: '/'
})
const clobClient = new ClobPublicClient(transport)
const apiClient = new ApiServiceClient(transport)

export {
  clobClient,
  apiClient
}
