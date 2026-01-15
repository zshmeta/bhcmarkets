import {useRiskBanner} from './useRiskBanner';
import {RiskBannerView} from './RiskBanner.view';

/* ═══════════════════════════════════════════════════════════
 * RISK RIBBON CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component connecting store via useRiskBanner hook
 * to the pure RiskBannerView presentational component.
 */

interface RiskBannerProps {
    compact?: boolean;
    full?: boolean;
}

const RiskBanner = ({ compact = false, full = false }: RiskBannerProps) => {
    const {
        riskMetrics,
        overallRisk,
        riskLevel,
        riskLabel,
        riskDescription,
        performanceMetrics,
        marketMetrics,
        translations,
    } = useRiskBanner();

    return (
        <RiskBannerView
            compact={compact}
            full={full}
            riskMetrics={riskMetrics}
            overallRisk={overallRisk}
            riskLevel={riskLevel}
            riskLabel={riskLabel}
            riskDescription={riskDescription}
            performanceMetrics={performanceMetrics}
            marketMetrics={marketMetrics}
            translations={translations}
        />
    );
}

export { RiskBanner };
