import styled from 'styled-components';
import AssetList from './assetList';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { BudgetType, ReTurnProject, IBudgetItem } from 'type/project.type';
import useTranslation from 'hooks/useTranslation';
import { EvaIcon } from '@paljs/ui/Icon';
import { IUpdateBudgetParams, UpdateBudget } from 'requests/cityHall';
import { AppActionType, useAuthContext } from 'providers/authProvider';
import useToast, { ToastType } from 'hooks/useToast';

const Box = styled.div`
  padding: 40px 20px;
`;

const FirstLine = styled.ul`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  li {
    border: 1px solid #f1f1f1;
    margin-bottom: 40px;
    box-sizing: border-box;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 48%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1rem;
    //background: #fff;
    color: #fff;
    div {
      text-align: center;
    }
    &:nth-child(1) {
      background: linear-gradient(to right, #f1a6b6, #8f69d2);
    }
    &:nth-child(2) {
      background: linear-gradient(to right, #3bdabe, #44b5f4);
    }
  }
  .num {
    font-size: 25px;
    padding-top: 10px;
    font-weight: bold;
  }
`;

const FlexBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  .iconRht {
    margin-left: 10px;
    margin-top: 8px;
    cursor: pointer;
  }
  .inputBg {
    background: transparent;
    border: 0;
    border-bottom: 1px solid #000;
    text-align: center;
    font-size: 1rem;
    padding: 0.5rem 0;
    &:focus {
      outline: none;
    }
  }
`;

interface IProps {
  detail?: ReTurnProject;
  refreshProject: () => void;
}

export default function Assets({ detail, refreshProject }: IProps) {
  const { t } = useTranslation();
  const { Toast, showToast } = useToast();
  const { dispatch } = useAuthContext();

  const [token, setToken] = useState<IBudgetItem>();
  const [point, setPoint] = useState<IBudgetItem>();
  const [showLft, setShowLft] = useState(false);
  const [editPoint, setEditPoint] = useState<number | string>('');
  const [editToken, setEditToken] = useState<number | string>('');

  const [showRht, setShowRht] = useState(false);

  useEffect(() => {
    if (!detail) {
      return;
    }
    console.log(detail.id);
    const _token = detail?.budgets.find((b) => b.type === BudgetType.Token);
    const _point = detail?.budgets.find((b) => b.type === BudgetType.Credit);
    setToken(_token);
    setPoint(_point);
  }, [detail?.budgets]);

  const handleShow1 = () => {
    setShowLft(true);
  };
  const hideShow1 = () => {
    setShowRht(false);

    const obj: IUpdateBudgetParams = {
      total_amount: Number(editToken),
      asset_name: 'USDT',
      asset_type: 'token',
    };
    submitEditPT(obj);
  };

  const handleShow2 = () => {
    setShowRht(true);
  };
  const hideShow2 = () => {
    setShowRht(false);
    const obj: IUpdateBudgetParams = {
      total_amount: Number(editPoint),
      asset_name: 'SCR',
      asset_type: 'credit',
    };
    submitEditPT(obj);
  };

  const submitEditPT = async (obj: IUpdateBudgetParams) => {
    dispatch({ type: AppActionType.SET_LOADING, payload: true });
    try {
      await UpdateBudget(obj);
      showToast(t('Project.changeBudgetSuccess'), ToastType.Success);
      refreshProject();
    } catch (e) {
      console.error(e);
      showToast(JSON.stringify(e), ToastType.Danger);
    } finally {
      dispatch({ type: AppActionType.SET_LOADING, payload: null });
    }
  };

  const handleInput = (e: ChangeEvent, type: string) => {
    const { value } = e.target as HTMLInputElement;
    if (type === 'points') {
      setEditPoint(value);
    } else if (type === 'token') {
      setEditToken(value);
    }
  };
  return (
    <Box>
      {Toast}
      <FirstLine>
        <li>
          <div className="line">
            <div>{t('Guild.RemainingUSDBudget')}</div>
            <FlexBox>
              <div className="num">{token?.remain_amount || 0}</div>
            </FlexBox>
          </div>
          <div>
            <div>{t('Guild.USDBudget')}</div>

            {!showLft && (
              <FlexBox onClick={() => handleShow1()}>
                <div className="num">{token?.total_amount || 0}</div>
                <EvaIcon name="edit-2-outline" className="iconRht" />
              </FlexBox>
            )}

            {showLft && (
              <FlexBox onClick={() => hideShow1()}>
                <input type="text" className="inputBg" value={editToken} onChange={(e) => handleInput(e, 'token')} />
                <EvaIcon name="checkmark-outline" className="iconRht" />
              </FlexBox>
            )}
          </div>
        </li>
        <li>
          <div>
            <div>{t('Guild.RemainingPointsBudget')}</div>
            <FlexBox>
              <div className="num">{point?.remain_amount || 0}</div>
            </FlexBox>
          </div>
          <div>
            <div>{t('Guild.PointsBudget')}</div>
            <FlexBox>
              {!showRht && (
                <FlexBox onClick={() => handleShow2()}>
                  <div className="num">{point?.total_amount || 0}</div>
                  <EvaIcon name="edit-2-outline" className="iconRht" />
                </FlexBox>
              )}

              {showRht && (
                <FlexBox>
                  <input type="text" className="inputBg" value={editPoint} onChange={(e) => handleInput(e, 'points')} />
                  <span onClick={() => hideShow2()}>
                    <EvaIcon name="checkmark-outline" className="iconRht" />
                  </span>
                </FlexBox>
              )}
            </FlexBox>
          </div>
        </li>
      </FirstLine>

      <AssetList id={detail.id} />
    </Box>
  );
}