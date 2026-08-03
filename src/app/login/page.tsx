import PageTemplate from '@/components/templates/PageTemplate'
import { AgentLoginPageContent } from '@pages/login'

const LoginPage = () => {
  return (
    <PageTemplate noHeader noFooter>
      <AgentLoginPageContent />
    </PageTemplate>
  )
}

export default LoginPage
