import APIBase from './APIBase'

type ContactFormRequest = {
  name: string
  email: string
  phone?: string
  message: string
}

type ContactRequestInfo = {
  name: string
  email: string
  phone: string
  message: string
  mlsNumber: string
}

export type ContactScheduleMethod = 'InPerson' | 'LiveVideo'

type HomeTourRequest = {
  name: string
  email: string
  phone: string
  method: ContactScheduleMethod
  date: string
  time: string
  mlsNumber: string
}

type MeetingRequest = {
  name: string
  email: string
  phone: string
  date: string
  time: string
  estimateId: number
}

class APIContact extends APIBase {
  addComment(body: ContactFormRequest) {
    return this.fetchRaw('/contact/contactus', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  submit(body: ContactFormRequest & { mlsNumber?: string }) {
    if (body.mlsNumber) {
      return this.requestInfo({
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        message: body.message,
        mlsNumber: body.mlsNumber
      })
    }
    return this.fetchJSON('/contact/contactus', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message
      })
    })
  }

  requestInfo(body: ContactRequestInfo) {
    return this.fetchJSON('/contact/requestinfo', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  homeTourRequest(body: HomeTourRequest) {
    return this.fetchJSON('/contact/schedule', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  meetingRequest(body: MeetingRequest) {
    return this.fetchRaw('/contact/schedule/estimate', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }
}

const apiContactInstance = new APIContact()
export default apiContactInstance
