import { useState } from 'react';
import IntakeQuestion from './IntakeQuestion';
import Spinner from '../shared/Spinner';
import * as api from '../../services/api';

const DOMAINS = [
  { value: 'housing', label: 'Renting & Housing', icon: '🏠', desc: 'Tenancy disputes, rent, eviction, deposits' },
  { value: 'employment', label: 'Job & Employment', icon: '💼', desc: 'Unpaid salary, wrongful termination, contracts' },
  { value: 'property', label: 'Property & Land', icon: '⛰️', desc: 'Boundary disputes, deeds, division, inheritance' },
  { value: 'family', label: 'Family & Divorce', icon: '👪', desc: 'Divorce, custody, maintenance, domestic matters' },
  { value: 'consumer', label: 'Consumer Disputes', icon: '🛒', desc: 'Defective products, fraud, service failure' },
  { value: 'contract', label: 'Contracts & Agreements', icon: '📄', desc: 'Business agreements, NDA, service breach' }
];

const SUBDOMAINS = {
  housing: [
    { value: 'Landlord tenant dispute', label: 'Tenant-Landlord Dispute', desc: 'General friction, rent increases, repairs' },
    { value: 'Eviction notice', label: 'Eviction Threat', desc: 'Received or issuing eviction notices' },
    { value: 'Security deposit issue', label: 'Security Deposit Claim', desc: 'Landlord refusing to refund deposit' },
    { value: 'Lease agreement questions', label: 'Agreement Questions', desc: 'Understanding terms or drafting questions' }
  ],
  employment: [
    { value: 'Unpaid wages/Salary dispute', label: 'Unpaid Salary', desc: 'Withheld wages, dues, or bonuses' },
    { value: 'Unfair dismissal', label: 'Wrongful Dismissal', desc: 'Abrupt or unjust firing' },
    { value: 'Sexual harassment / Discrimination', label: 'Harassment & Discrimination', desc: 'Workplace safety and parity issues' },
    { value: 'Contract breach', label: 'Contractual Disputes', desc: 'Violating notice period or terms' }
  ],
  property: [
    { value: 'Partition dispute', label: 'Partition / Division', desc: 'Splitting property among family or partners' },
    { value: 'Illegal encroachment', label: 'Encroachment', desc: 'Unauthorized construction or land occupation' },
    { value: 'Registration/Stamp duty', label: 'Stamp & Registration', desc: 'Incomplete paperwork or registry issues' },
    { value: 'Title clearance', label: 'Title Clearance', desc: 'Verifying legal ownership chain' }
  ],
  family: [
    { value: 'Mutual divorce', label: 'Mutual Consent Divorce', desc: 'Both partners agree to end marriage' },
    { value: 'Maintenance/Alimony', label: 'Maintenance / Alimony', desc: 'Financial support claims' },
    { value: 'Child custody', label: 'Child Custody', desc: 'Guardian rights and visiting privileges' },
    { value: 'Domestic violence', label: 'Domestic Disputes', desc: 'Safety and protective legal orders' }
  ],
  consumer: [
    { value: 'Defective goods', label: 'Defective Products', desc: 'Damaged or poor quality purchases' },
    { value: 'E-commerce fraud', label: 'Online Fraud', desc: 'Fake products or payment scam issues' },
    { value: 'Insurance claim delay', label: 'Insurance Delays', desc: 'Claim rejected or severely delayed' },
    { value: 'Medical negligence', label: 'Medical Negligence', desc: 'Substandard care by healthcare provider' }
  ],
  contract: [
    { value: 'Standard service contract', label: 'Service Contract', desc: 'Breach by vendor or freelancer' },
    { value: 'NDA breach', label: 'Confidentiality Breach', desc: 'Unauthorized disclosure of data' },
    { value: 'Partnership dispute', label: 'Partnership Conflict', desc: 'Disagreements with business co-owners' },
    { value: 'Financial default', label: 'Payment Default', desc: 'Client refusing to pay invoice dues' }
  ]
};

const EXTRA_DETAILS = [
  { value: 'notice_sent', label: 'Have you sent a formal notice?', desc: 'Written request sent to the opposite party' },
  { value: 'has_documents', label: 'Do you have written contracts/receipts?', desc: 'Tangible proofs of agreement or transaction' },
  { value: 'long_duration', label: 'Has this issue lasted over 6 months?', desc: 'Long standing dispute needing intervention' },
  { value: 'mediation_tried', label: 'Have you tried mutual settlement?', desc: 'Informal chats or mediation before this' }
];

const MAP_DOMAIN_TO_CASETYPE = {
  housing: 'Tenant Rights',
  employment: 'Labor / Employment Dispute',
  property: 'Property Dispute',
  family: 'Family Dispute',
  consumer: 'Consumer Grievance',
  contract: 'Contract Dispute'
};

export default function IntakeFlow({ onClose, onIntakeComplete }) {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState(null);
  const [subdomain, setSubdomain] = useState(null);
  const [extras, setExtras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const selectedSub = SUBDOMAINS[domain]?.find(s => s.value === subdomain)?.label || subdomain;
      const detectedCaseType = MAP_DOMAIN_TO_CASETYPE[domain] || 'General Dispute';
      
      const payload = {
        domain,
        subdomain: selectedSub,
        extras,
        caseType: detectedCaseType
      };

      await api.runIntake(payload);
      onIntakeComplete(detectedCaseType);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !domain) return true;
    if (step === 2 && !subdomain) return true;
    return false;
  };

  return (
    <div className="intake-overlay">
      <div className="intake-modal">
        <button className="intake-close-btn" onClick={onClose} disabled={isLoading}>×</button>

        <div className="intake-progress-header">
          <span className="intake-step-indicator">Step {step} of 3</span>
          <div className="intake-progress-track">
            <div className="intake-progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        <div className="intake-content">
          {isLoading ? (
            <div className="intake-loading">
              <Spinner size={36} />
              <p>Analyzing your answers and generating legal insights...</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <IntakeQuestion
                  question="Which legal domain fits your situation?"
                  options={DOMAINS}
                  selectedValue={domain}
                  onSelect={(val) => { setDomain(val); setSubdomain(null); }}
                />
              )}

              {step === 2 && (
                <IntakeQuestion
                  question="What specific dispute are you facing?"
                  options={SUBDOMAINS[domain] || []}
                  selectedValue={subdomain}
                  onSelect={setSubdomain}
                />
              )}

              {step === 3 && (
                <IntakeQuestion
                  question="Any additional details about the case?"
                  options={EXTRA_DETAILS}
                  selectedValue={extras}
                  onSelect={setExtras}
                  multiSelect={true}
                />
              )}
            </>
          )}
        </div>

        {!isLoading && (
          <div className="intake-actions">
            {step > 1 && (
              <button className="intake-btn intake-btn-secondary" onClick={handleBack}>
                ← Back
              </button>
            )}
            <button
              className="intake-btn intake-btn-primary"
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              {step === 3 ? 'Analyze Situation →' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
