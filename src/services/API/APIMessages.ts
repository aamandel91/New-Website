import type { ApiMessage, ApiMessageResponse } from './types'

import APIBase from './APIBase'

class APIMessages extends APIBase {
  fetchList(pageNum: number = 1): Promise<ApiMessageResponse> {
    return this.fetchJSON(`/messages/?pageNum=${pageNum}&resultsPerPage=50`)
  }

  send(content: {
    message: string
    listings?: string[]
    links?: string[]
  }): Promise<ApiMessage> {
    return this.fetchJSON('/messages/', {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }
}

const apiMessagesInstance = new APIMessages()
export default apiMessagesInstance
