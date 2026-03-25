'use client';

import { useReducer, useMemo } from 'react';
import { FeedEntry, WizardState, WizardAction, WizardStep } from '@/lib/types';
import StepIndicator from './StepIndicator';
import DataSourceStep from './steps/DataSourceStep';
import LogicStep from './steps/LogicStep';
import BuildDeployStep from './steps/BuildDeployStep';
import ConnectStep from './steps/ConnectStep';

const initialState: WizardState = {
  currentStep: 1,
  dataSource: null,
  logic: null,
  buildSteps: [],
  deployResult: null,
  fastApiKey: '',
  fastTestResult: null,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_DATA_SOURCE':
      return { ...state, dataSource: action.config, currentStep: 2 };
    case 'SET_LOGIC':
      return { ...state, logic: action.config, currentStep: 3 };
    case 'UPDATE_BUILD_STEPS':
      return { ...state, buildSteps: action.steps };
    case 'SET_DEPLOY_RESULT':
      return { ...state, deployResult: action.result };
    case 'SET_FAST_API_KEY':
      return { ...state, fastApiKey: action.key };
    case 'SET_FAST_RESULT':
      return { ...state, fastTestResult: action.result };
    case 'GO_BACK':
      return { ...state, currentStep: Math.max(1, state.currentStep - 1) as WizardStep };
    default:
      return state;
  }
}

function SedaLogoIcon() {
  return (
    <svg className="hero__logo" viewBox="0 0 398 373" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M203.749 0C202.098 4.43118 200.39 9.8963 199.283 15.7307C196.093 32.4768 199.114 44.5703 208.29 51.6417C216.921 58.3069 241.952 69.0894 268.446 80.4997C277.096 84.2293 285.953 88.0327 294.959 92.0023C284.658 58.0669 233.583 19.2018 203.749 0Z" fill="currentColor"/>
      <path d="M151.118 31.4064C118.113 59.1751 100.662 84.119 100.662 103.561C100.662 142.223 173.409 168.847 201.424 175.844C205.739 176.915 297.963 200.456 315.788 251.654C325.095 245.968 338.061 237.789 351.008 228.797C395.966 197.557 397.429 186.682 397.467 186.221C397.467 180.276 391.8 166.945 353.879 144.974C326.071 128.874 290.758 113.66 259.61 100.237C229.419 87.2393 205.57 76.9552 194.781 68.6283C174.948 53.3038 174.104 29.8555 177.913 10.8014C169.713 16.5989 160.387 23.6149 151.118 31.4064Z" fill="currentColor"/>
      <path d="M189.153 321.002C180.522 314.337 155.51 303.554 129.016 292.144C120.366 288.414 111.509 284.611 102.503 280.623C112.804 314.558 163.879 353.423 193.713 372.625C195.364 368.194 197.072 362.729 198.179 356.913C201.369 340.167 198.348 328.073 189.172 321.002H189.153Z" fill="currentColor"/>
      <path d="M246.349 341.219C279.354 313.45 296.804 288.507 296.804 269.046C296.804 230.384 224.076 203.76 196.043 196.763C191.728 195.692 99.504 172.151 81.6785 120.953C72.3717 126.639 59.4059 134.819 46.459 143.81C1.5011 175.05 0.0375274 185.925 0 186.368C0 192.313 5.66664 205.644 43.5881 227.615C71.3959 243.715 106.709 258.928 137.857 272.351C168.048 285.349 191.897 295.633 202.704 303.96C222.538 319.285 223.382 342.733 219.573 361.787C227.773 355.99 237.098 348.974 246.368 341.182L246.349 341.219Z" fill="currentColor"/>
    </svg>
  );
}

interface Props {
  feeds: FeedEntry[];
}

export default function OracleBuilder({ feeds }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    if (state.dataSource) completed.push(1);
    if (state.logic) completed.push(2);
    if (state.deployResult) completed.push(3);
    return completed;
  }, [state.dataSource, state.logic, state.deployResult]);

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div className="hero fade-up">
        <h1 className="hero__title">
          <SedaLogoIcon />
          {' '}Oracle Program Builder
        </h1>
        <p className="hero__subtitle">
          Build and deploy a SEDA Oracle Program in minutes. Select your data source, configure logic, and connect via SEDA Fast.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={state.currentStep} completedSteps={completedSteps} />

      {/* Active Step */}
      {state.currentStep === 1 && (
        <DataSourceStep
          feeds={feeds}
          config={state.dataSource}
          onComplete={(config) => dispatch({ type: 'SET_DATA_SOURCE', config })}
        />
      )}

      {state.currentStep === 2 && state.dataSource && (
        <LogicStep
          dataSource={state.dataSource}
          config={state.logic}
          onComplete={(config) => dispatch({ type: 'SET_LOGIC', config })}
          onBack={() => dispatch({ type: 'GO_BACK' })}
        />
      )}

      {state.currentStep === 3 && state.dataSource && state.logic && (
        <BuildDeployStep
          dataSource={state.dataSource}
          logic={state.logic}
          deployResult={state.deployResult}
          onDeployComplete={(result) => dispatch({ type: 'SET_DEPLOY_RESULT', result })}
          onBack={() => dispatch({ type: 'GO_BACK' })}
          onNext={() => dispatch({ type: 'SET_STEP', step: 4 })}
        />
      )}

      {state.currentStep === 4 && state.deployResult && (
        <ConnectStep
          deployResult={state.deployResult}
          onBack={() => dispatch({ type: 'GO_BACK' })}
        />
      )}
    </div>
  );
}
