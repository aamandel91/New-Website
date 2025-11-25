import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { SignUpRequest } from 'services/API';
import APIAuth from 'services/API/APIAuth';
import { useUser } from '@/providers/UserProvider';
import { getTrafficSource } from '@/utils/trafficSource';

import SignupFormStep from '../AuthDialog/components/SignupFormStep';
import ThirdPartyLoginForm from '../AuthDialog/components/ThirdPartyLoginForm';
import OrDivider from '../AuthDialog/components/OrDivider';
import TermsAndPrivacy from '../AuthDialog/components/TermsAndPrivacy';

interface PropertyRegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  isRequired?: boolean; // true for PPC, false for organic
  propertyAddress?: string;
}

const PropertyRegistrationDialog = ({
  open,
  onClose,
  isRequired = false,
  propertyAddress,
}: PropertyRegistrationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const { refreshUser } = useUser();

  const handleClose = () => {
    // Only allow closing if registration is not required
    if (!isRequired) {
      onClose();
    }
  };

  const handleSignup = useCallback(
    async (data: SignUpRequest) => {
      setLoading(true);
      try {
        // Get traffic source data
        const trafficSource = getTrafficSource();

        // Prepare signup request with traffic source data
        const signupData: SignUpRequest = {
          ...data,
          referer: trafficSource?.referer,
          utmSource: trafficSource?.utmSource,
          utmMedium: trafficSource?.utmMedium,
          utmCampaign: trafficSource?.utmCampaign,
          utmTerm: trafficSource?.utmTerm,
          utmContent: trafficSource?.utmContent,
          landingPage: trafficSource?.landingPage,
        };

        await APIAuth.signup(signupData);
        setStep('otp');
      } catch (error) {
        console.error('Signup failed:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleGoogleOAuth = async () => {
    try {
      const trafficSource = getTrafficSource();

      // Store traffic source in sessionStorage for OAuth callback
      if (trafficSource) {
        sessionStorage.setItem('oauth_traffic_source', JSON.stringify(trafficSource));
      }

      const { url } = await APIAuth.auth('google');
      window.location.href = url;
    } catch (error) {
      console.error('Google OAuth failed:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isRequired}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            {isRequired ? 'Create an Account to Continue' : 'Save This Property'}
          </Typography>
          {!isRequired && (
            <IconButton edge="end" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {propertyAddress && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                {isRequired
                  ? `To view details for ${propertyAddress}, please create a free account.`
                  : `Create an account to save ${propertyAddress} and get updates on this property.`}
              </Typography>
            </Box>
          )}

          {step === 'form' ? (
            <>
              <ThirdPartyLoginForm
                onGoogleClick={handleGoogleOAuth}
                buttonText="Continue with Google"
              />

              <OrDivider />

              <SignupFormStep
                visible={true}
                loading={loading}
                onSubmit={handleSignup}
              />

              <TermsAndPrivacy />
            </>
          ) : (
            <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
              <Typography variant="h6" textAlign="center">
                Check your email
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                We've sent you a verification link. Click the link in the email to complete your
                registration.
              </Typography>
              <Button
                variant="text"
                onClick={() => setStep('form')}
                sx={{ mt: 2 }}
              >
                Use a different email
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      {!isRequired && step === 'form' && (
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Maybe Later
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PropertyRegistrationDialog;
