import styled from 'styled-components';
import { ContainerPadding } from 'assets/styles/global';
import BackerNav from 'components/common/backNav';
import { useTranslation } from 'react-i18next';
import ProposalProvider from './store';
import ChooseTypeStep from './chooseType';
import ChooseTemplateStep from './chooseTemplate';
import CreateStep from './createStep';
import { useProposalContext } from './store';

const CreateProposalSteps = () => {
  const { t } = useTranslation();
  const { currentStep, proposalType, goBackStepOne } = useProposalContext();

  const showstep = () => {
    switch (currentStep) {
      case 1:
        return <ChooseTypeStep />;
      case 2:
        return <ChooseTemplateStep />;
      case 3:
        return <CreateStep />;
      default:
        return null;
    }
  };

  const backTo = () => {
    if (currentStep !== 1) {
      // back to step 1
      goBackStepOne();
    }
  };

  const backNavTitle = currentStep === 2 && proposalType ? t(proposalType.name as any) : t('Proposal.CreateProposal');

  return (
    <>
      <BackerNav
        title={backNavTitle}
        to={currentStep === 1 ? '/proposal-v2' : '/proposal-v2/create'}
        onClick={backTo}
      />
      {showstep()}
    </>
  );
};

export default function CreateProposalPage() {
  return (
    <Page>
      <ProposalProvider>
        <CreateProposalSteps />
      </ProposalProvider>
    </Page>
  );
}

const Page = styled.div`
  ${ContainerPadding};
  color: var(--bs-body-color_active);
`;