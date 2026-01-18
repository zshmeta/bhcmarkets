import { useMemo, useState, useCallback, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Notification, Text } from "@repo/ui";
import { useAuth } from "../auth/auth.hooks.js";
import { authApi } from "../auth/auth.api.js";
import { AuthLayout } from "../components/AuthLayout.js";
import { isAcceptablePassword, isLikelyEmail } from "../lib/validation.js";
import { resolveReturnTo } from "../lib/redirectUtils.js";
import { InputWrapper, StyledInput, FloatingLabel, NeonButton, ErrorText } from "../components/Design/System.js";

// --- Types & Constants ---

interface FormData {
	email: string;
	password: string;
	confirmPassword: string;
	firstName: string;
	lastName: string;
	phone: string;
	acceptTerms: boolean;
	acceptPrivacy: boolean;
	acceptMarketing: boolean;
}

type StepId = 0 | 1 | 2;

const STEPS = [
	{ label: "Account", description: "Credentials" },
	{ label: "Profile", description: "Details" },
	{ label: "Terms", description: "Review" },
];

const INITIAL_FORM_DATA: FormData = {
	email: "",
	password: "",
	confirmPassword: "",
	firstName: "",
	lastName: "",
	phone: "",
	acceptTerms: false,
	acceptPrivacy: false,
	acceptMarketing: false,
};

// --- Styled Components for Registration ---

const ButtonRow = styled.div`
	display: flex;
	gap: 16px;
	margin-top: 32px;
`;

const StepperContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 14px;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    z-index: 0;
  }
`;

const StepIndicator = styled.div<{ $active: boolean, $completed: boolean }>`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  opacity: ${props => props.$active || props.$completed ? 1 : 0.5};
  
  /* Circle */
  &::before {
    content: '${props => props.$completed ? '✓' : ''}';
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: ${props => props.$active ? '#58A6FF' : (props.$completed ? '#238636' : '#0D1117')};
    border: 2px solid ${props => props.$active ? '#58A6FF' : (props.$completed ? '#238636' : 'rgba(255,255,255,0.2)')};
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    box-shadow: ${props => props.$active ? '0 0 15px rgba(88, 166, 255, 0.4)' : 'none'};
    transition: all 0.3s ease;
  }
`;

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #8b949e;
  
  input {
    margin-top: 4px;
    accent-color: #58A6FF;
    width: 16px;
    height: 16px;
  }
  
  a {
    color: #58A6FF;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

// --- Step Components ---

interface StepProps {
	data: FormData;
	onChange: (field: keyof FormData, value: string | boolean) => void;
	loading: boolean;
	error: string | null;
}

function AccountStep({ data, onChange, loading }: StepProps) {
	return (
		<>
			<InputWrapper>
				<StyledInput
					id="email"
					value={data.email}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("email", e.target.value)}
					placeholder=" "
					autoComplete="email"
					autoFocus
					required
					disabled={loading}
				/>
				<FloatingLabel htmlFor="email">Email Address</FloatingLabel>
			</InputWrapper>

			<InputWrapper>
				<StyledInput
					id="password"
					type="password"
					value={data.password}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("password", e.target.value)}
					placeholder=" "
					autoComplete="new-password"
					required
					disabled={loading}
				/>
				<FloatingLabel htmlFor="password">Password (Min 12 chars)</FloatingLabel>
			</InputWrapper>

			<InputWrapper>
				<StyledInput
					id="confirmPassword"
					type="password"
					value={data.confirmPassword}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("confirmPassword", e.target.value)}
					placeholder=" "
					autoComplete="new-password"
					required
					disabled={loading}
				/>
				<FloatingLabel htmlFor="confirmPassword">Confirm Password</FloatingLabel>
				{data.confirmPassword && data.password !== data.confirmPassword && (
					<ErrorText>Passwords do not match</ErrorText>
				)}
			</InputWrapper>
		</>
	);
}

function ProfileStep({ data, onChange, loading }: StepProps) {
	return (
		<>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
				<InputWrapper>
					<StyledInput
						id="firstName"
						value={data.firstName}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("firstName", e.target.value)}
						placeholder=" "
						autoComplete="given-name"
						disabled={loading}
					/>
					<FloatingLabel htmlFor="firstName">First Name</FloatingLabel>
				</InputWrapper>

				<InputWrapper>
					<StyledInput
						id="lastName"
						value={data.lastName}
						onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("lastName", e.target.value)}
						placeholder=" "
						autoComplete="family-name"
						disabled={loading}
					/>
					<FloatingLabel htmlFor="lastName">Last Name</FloatingLabel>
				</InputWrapper>
			</div>

			<InputWrapper>
				<StyledInput
					id="phone"
					value={data.phone}
					onChange={(e: ChangeEvent<HTMLInputElement>) => onChange("phone", e.target.value)}
					placeholder=" "
					autoComplete="tel"
					disabled={loading}
				/>
				<FloatingLabel htmlFor="phone">Phone Number (Optional)</FloatingLabel>
			</InputWrapper>
		</>
	);
}

function TermsStep({ data, onChange, loading }: StepProps) {
	return (
		<div style={{ padding: '8px 0' }}>
			<CheckboxWrapper>
				<input
					type="checkbox"
					checked={data.acceptTerms}
					onChange={(e) => onChange("acceptTerms", e.target.checked)}
					disabled={loading}
				/>
				<span>
					I agree to the <a href="/legal/terms" target="_blank">Terms of Service</a>
				</span>
			</CheckboxWrapper>

			<CheckboxWrapper>
				<input
					type="checkbox"
					checked={data.acceptPrivacy}
					onChange={(e) => onChange("acceptPrivacy", e.target.checked)}
					disabled={loading}
				/>
				<span>
					I acknowledge the <a href="/legal/privacy" target="_blank">Privacy Policy</a>
				</span>
			</CheckboxWrapper>

			<CheckboxWrapper>
				<input
					type="checkbox"
					checked={data.acceptMarketing}
					onChange={(e) => onChange("acceptMarketing", e.target.checked)}
					disabled={loading}
				/>
				<span>I'd like to receive product updates (Optional)</span>
			</CheckboxWrapper>
		</div>
	);
}

// --- Main Component ---

function buildLink(path: string, returnTo?: string): string {
	if (!returnTo) return path;
	return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function RegisterPage() {
	const { register, loading, error, clearError } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	// Return URL handling
	const safeReturnTo = useMemo(
		() => resolveReturnTo(new URLSearchParams(location.search)),
		[location.search]
	);
	const returnTo = safeReturnTo?.value;

	// Form state
	const [currentStep, setCurrentStep] = useState<StepId>(0);
	const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
	const [localError, setLocalError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Update form field
	const handleFieldChange = useCallback((field: keyof FormData, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setLocalError(null);
		clearError();
	}, [clearError]);

	// Validation
	const validateStep = useCallback((step: StepId): string | null => {
		switch (step) {
			case 0:
				if (!isLikelyEmail(formData.email)) return "Please enter a valid email address";
				if (!isAcceptablePassword(formData.password)) return "Password must be at least 12 characters";
				if (formData.password !== formData.confirmPassword) return "Passwords do not match";
				return null;
			case 1:
				return null; // Profile is optional
			case 2:
				if (!formData.acceptTerms) return "You must accept the Terms of Service";
				if (!formData.acceptPrivacy) return "You must acknowledge the Privacy Policy";
				return null;
			default:
				return null;
		}
	}, [formData]);

	const isCurrentStepValid = useCallback(() => validateStep(currentStep) === null, [currentStep, validateStep]);

	// Navigation
	const goToNextStep = useCallback(() => {
		const validationError = validateStep(currentStep);
		if (validationError) {
			setLocalError(validationError);
			return;
		}
		if (currentStep < 2) {
			setCurrentStep((prev) => (prev + 1) as StepId);
			setLocalError(null);
		}
	}, [currentStep, validateStep]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => (prev - 1) as StepId);
			setLocalError(null);
		}
	}, [currentStep]);

	// Submit
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const validationError = validateStep(currentStep);
		if (validationError) {
			setLocalError(validationError);
			return;
		}

		setIsSubmitting(true);
		setLocalError(null);
		clearError();

		try {
			await register({
				email: formData.email,
				password: formData.password,
				issueSession: true,
			});

			if (safeReturnTo?.kind === "absolute") {
				try {
					const { code } = await authApi.generateAuthCode({ targetUrl: safeReturnTo.value });
					const url = new URL(safeReturnTo.value);
					url.searchParams.set("code", code);
					window.location.replace(url.toString());
					return;
				} catch (handoffError) {
					console.error("Handoff failed", handoffError);
					setLocalError(`Registration successful, but redirection failed: ${handoffError instanceof Error ? handoffError.message : String(handoffError)}`);
                    setIsSubmitting(false); // Stop loading so they see the error
				}
			} else {
				redirectToReturnTo(safeReturnTo, navigate);
			}
		} catch (err) {
			setLocalError(err instanceof Error ? err.message : "Registration failed.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const displayError = error || localError;
	const isLoading = loading || isSubmitting;

	return (
		<AuthLayout title="Create Account" subtitle="Join the future of trading">
			
      {/* Custom Stepper */}
      <StepperContainer>
        {STEPS.map((step, index) => (
          <StepIndicator 
            key={index} 
            $active={index === currentStep} 
            $completed={index < currentStep}
            onClick={() => index < currentStep && setCurrentStep(index as StepId)}
          >
            <Text variant="caption" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{step.label}</Text>
          </StepIndicator>
        ))}
      </StepperContainer>

			{displayError && (
				<Notification
					variant="danger"
					title="Check details"
					message={displayError}
					onClose={() => {
						setLocalError(null);
						clearError();
					}}
          style={{ marginBottom: '24px' }}
				/>
			)}

			<form onSubmit={handleSubmit}>
				{currentStep === 0 && <AccountStep data={formData} onChange={handleFieldChange} loading={isLoading} error={displayError} />}
				{currentStep === 1 && <ProfileStep data={formData} onChange={handleFieldChange} loading={isLoading} error={displayError} />}
				{currentStep === 2 && <TermsStep data={formData} onChange={handleFieldChange} loading={isLoading} error={displayError} />}

				<ButtonRow>
					{currentStep > 0 && (
						<NeonButton type="button" $variant="secondary" onClick={goToPreviousStep} disabled={isLoading} style={{ width: '40%' }}>
							Back
						</NeonButton>
					)}

					{currentStep < 2 ? (
						<NeonButton type="button" $variant="primary" onClick={goToNextStep} disabled={isLoading} style={{ width: currentStep === 0 ? '100%' : '60%' }}>
							Continue
						</NeonButton>
					) : (
						<NeonButton type="submit" $variant="primary" disabled={isLoading} $loading={isLoading} style={{ width: '60%' }}>
							{isLoading ? "" : "Complete"}
						</NeonButton>
					)}
				</ButtonRow>
			</form>

			<div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
				<Text color="secondary" variant="caption">
					Already have an account? <Link to={buildLink("/login", returnTo)} style={{ color: '#58A6FF', textDecoration: 'none' }}>Sign in</Link>
				</Text>
			</div>
		</AuthLayout>
	);
}

export default RegisterPage;
