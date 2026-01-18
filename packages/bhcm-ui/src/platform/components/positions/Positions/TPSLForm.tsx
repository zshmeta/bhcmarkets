import { useState } from 'react';
import { Icons } from '../Icons';
import {
    Container,
    Header,
    Title,
    CloseButton,
    Form,
    Field,
    Label,
    InputWrapper,
    Input,
    Suffix,
    Actions,
    SubmitButton,
    CancelButton,
} from './TPSLForm.styles';

/* ═══════════════════════════════════════════════════════════
 * TPSL FORM
 * ═══════════════════════════════════════════════════════════
 * Form for setting Take Profit and Stop Loss triggers on a
 * position. Pure component.
 */

export interface TPSLTranslations {
    takeProfit: string;
    stopLoss: string;
    triggerPrice: string;
    save: string;
    cancel: string;
    close: string;
    error: string;
    success: string;
}

export interface TPSLFormProps {
    symbol: string;
    currentPrice: number;
    avgEntryPrice: number;
    quantity: string;
    translations: TPSLTranslations;
    onClose: () => void;
    onSave: (tpPrice: string, slPrice: string) => void;
}

const TPSLForm = ({ symbol, translations, onClose, onSave }: TPSLFormProps) => {
    const [tpPrice, setTpPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation handled by parent or just passed through
        if (!tpPrice && !slPrice) {
            // Parent can handle error toast if needed, or we can use a callback for error
            // For now, checking empty submission
            return;
        }

        onSave(tpPrice, slPrice);
        onClose();
    };

    return (
        <Container>
            <Header>
                <Title>TP/SL - {symbol}</Title>
                <CloseButton onClick={onClose} aria-label={translations.close}>
                    <Icons name="x" size="sm" />
                </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
                <Field>
                    <Label>{translations.takeProfit}</Label>
                    <InputWrapper>
                        <Input
                            type="number"
                            step="any"
                            value={tpPrice}
                            onChange={(e) => setTpPrice(e.target.value)}
                            placeholder={translations.triggerPrice}
                        />
                        <Suffix>USD</Suffix>
                    </InputWrapper>
                </Field>

                <Field>
                    <Label>{translations.stopLoss}</Label>
                    <InputWrapper>
                        <Input
                            type="number"
                            step="any"
                            value={slPrice}
                            onChange={(e) => setSlPrice(e.target.value)}
                            placeholder={translations.triggerPrice}
                        />
                        <Suffix>USD</Suffix>
                    </InputWrapper>
                </Field>

                <Actions>
                    <CancelButton type="button" onClick={onClose}>
                        {translations.cancel}
                    </CancelButton>
                    <SubmitButton type="submit">{translations.save}</SubmitButton>
                </Actions>
            </Form>
        </Container>
    );
}

export { TPSLForm };
