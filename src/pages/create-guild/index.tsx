import { InputGroup, Button, Form } from 'react-bootstrap';
import styled from 'styled-components';
import React, { ChangeEvent, FormEvent, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createProjects } from 'requests/guild';
import { BudgetType, IBaseProject } from 'type/project.type';
import { AppActionType, useAuthContext } from 'providers/authProvider';
import useToast, { ToastType } from 'hooks/useToast';
import { AssetName } from 'utils/constant';
import { useNavigate } from 'react-router-dom';
import { ContainerPadding } from 'assets/styles/global';
import PlusMinusButton from 'components/common/plusAndMinusButton';
import CameraIconSVG from 'components/svgs/camera';
import BackerNav from 'components/common/backNav';
import MarkdownEditor from 'components/common/markdownEditor';
import SeeSelect from 'components/common/select';
import { UserRole } from 'type/user.type';
import { ethers } from 'ethers';
import sns from '@seedao/sns-js';

import { BlackButton } from 'components/common/button';
import { compressionFile, fileToDataURL } from 'utils/image';
import getConfig from "../../utils/envCofnig";

export default function CreateGuild() {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    dispatch,
    state: { theme },
  } = useAuthContext();
  const [adminList, setAdminList] = useState(['']);
  const [memberList, setMemberList] = useState<string[]>([]);
  const [proList, setProList] = useState(['']);
  const [token, setToken] = useState<number>();

  const [credit, setCredit] = useState<number>();

  const [proName, setProName] = useState('');
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');

  const [intro, setIntro] = useState('');

  const handleInput = (e: ChangeEvent, index: number, type: string) => {
    const { value } = e.target as HTMLInputElement;
    let arr: any[] = [];
    switch (type) {
      case 'member':
        arr = [...memberList];
        arr[index] = value;
        setMemberList(arr);
        break;
      case 'admin':
        arr = [...adminList];
        arr[index] = value;
        setAdminList(arr);
        break;
      case 'proposal':
        arr = [...proList];
        arr[index] = value;
        setProList(arr);
        break;
      case 'proName':
        setProName(value);
        break;
      case 'desc':
        setDesc(value);
        break;
      case 'credit':
        setCredit(Number(value));
        break;
      case 'token':
        setToken(Number(value));
        break;
    }
  };

  const handleAdd = (type: string) => {
    let arr: any[] = [];
    switch (type) {
      case 'member':
        arr = [...memberList];
        arr.push('');
        setMemberList(arr);
        break;
      case 'admin':
        arr = [...adminList];
        arr.push('');
        setAdminList(arr);
        break;
      case 'proposal':
        arr = [...proList];
        arr.push('');
        setProList(arr);
        break;
    }
  };
  const removeItem = (index: number, type: string) => {
    let arr: any[] = [];
    switch (type) {
      case 'member':
        arr = [...memberList];
        arr.splice(index, 1);
        setMemberList(arr);
        break;
      case 'admin':
        arr = [...adminList];
        arr.splice(index, 1);
        setAdminList(arr);
        break;
      case 'proposal':
        arr = [...proList];
        arr.splice(index, 1);
        setProList(arr);
        break;
    }
  };
  const handleModerators = async () => {
    const checkSNSlst: string[] = [];
    const sns2walletMap = new Map<string, string>();
    for (const item of adminList) {
      const _wallet = item.trim().toLocaleLowerCase();
      if (!ethers.utils.isAddress(_wallet)) {
        if (!_wallet.endsWith('.seedao')) {
          showToast(t('Msg.IncorrectAddress', { content: _wallet }), ToastType.Danger);
          return;
        } else {
          checkSNSlst.push(_wallet);
        }
      }
    }
    if (checkSNSlst.length) {
      try {
        const notOkList: string[] = [];
        const res = await sns.resolves(checkSNSlst,getConfig().NETWORK.rpcs[0]);
        for (let i = 0; i < res.length; i++) {
          const wallet = res[i];
          if (!wallet || ethers.constants.AddressZero === wallet) {
            notOkList.push(checkSNSlst[i]);
          } else {
            sns2walletMap.set(checkSNSlst[i], wallet);
          }
        }
        if (!!notOkList.length) {
          showToast(t('Msg.IncorrectAddress', { content: notOkList.join(', ') }), ToastType.Danger);
          return;
        }
      } catch (error) {
        logError('resolved failed', error);
        return;
      }
    }
    const _adminList: string[] = [];

    adminList.forEach((item) => {
      const wallet = sns2walletMap.get(item) || item;
      _adminList.push(wallet);
    });
    return _adminList;
  };
  const handleSubmit = async () => {
    const ids: string[] = [];
    const slugs: string[] = [];
    for (const l of proList) {
      if (l) {
        const _l = l.trim().toLocaleLowerCase();
        if (_l.startsWith('https://forum.seedao.xyz/') && !_l.startsWith('https://forum.seedao.xyz/thread/sip-')) {
          showToast(t('Msg.ProposalLinkMsg'), ToastType.Danger);
          return;
        }
        if (_l.startsWith('https://forum.seedao.xyz/thread/sip-')) {
          // sip
          const items = _l.split('/').reverse();
          slugs.push(items[0]);
          for (const it of items) {
            if (it) {
              const _id = it.split('-').reverse()[0];
              if (ids.includes(_id)) {
                showToast(t('Msg.RepeatProposal'), ToastType.Danger);
                return;
              }
              ids.push(_id);
              break;
            }
          }
        } else if (l.indexOf('/proposal/thread/') > -1) {
          // os
          const items = l.split('/').reverse();
          slugs.push(`os-${items[0]}`);
          for (const it of items) {
            if (it) {
              if (ids.includes(it)) {
                showToast(t('Msg.RepeatProposal'), ToastType.Danger);
                return;
              }
              ids.push(it);
              break;
            }
          }
        } else {
          showToast(t('Msg.ProposalLinkMsg'), ToastType.Danger);
          return;
        }
      }
    }
    dispatch({ type: AppActionType.SET_LOADING, payload: true });
    const _adminList = await handleModerators();
    if (!_adminList) {
      dispatch({ type: AppActionType.SET_LOADING, payload: false });
      return;
    }
    const obj: IBaseProject = {
      logo: url,
      name: proName,
      sponsors: _adminList,
      members: memberList,
      proposals: slugs,
      desc,
      intro,
      budgets: [],
    };
    try {
      let rt = await createProjects(obj);
      showToast(t('Guild.createSuccess'), ToastType.Success);

      const {
        data: { id },
      } = rt;
      // navigate('/explore?tab=guild');

      navigate(`/guild/info/${id}`);
    } catch (error) {
      showToast(t('Guild.createFailed'), ToastType.Danger);
    } finally {
      dispatch({ type: AppActionType.SET_LOADING, payload: null });
    }
  };

  const updateLogo = async (e: FormEvent) => {
    const { files } = e.target as any;
    const file = files[0];
    const new_file = await compressionFile(file, file.type);
    const base64 = await fileToDataURL(new_file);
    setUrl(base64);
  };

  const removeUrl = () => {
    setUrl('');
  };

  const handleBack = () => {
    navigate('/city-hall/governance');
  };

  const roleOptions = useMemo(() => {
    return [{ label: t('Guild.Moderator'), value: UserRole.Admin }];
  }, [t]);

  return (
    <OuterBox>
      <BackerNav title={t('Guild.create')} to="/city-hall/governance" />
      <FlexBox>
        <CardBody>
          <BtnBox htmlFor="fileUpload" onChange={(e) => updateLogo(e)}>
            <ImgBox>
              {url && <img src={url} alt="" />}
              <UpladBox
                className="upload"
                bg={
                  theme
                    ? 'linear-gradient(180deg, rgba(13,12,15,0) 0%, rgba(38,27,70,0.6) 100%)'
                    : 'linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(0,0,0,0.6) 100%)'
                }
              >
                <input id="fileUpload" type="file" hidden accept=".jpg, .jpeg, .png, .svg" />
                <CameraIconSVG />
                <UploadImgText>{t('Guild.upload')}</UploadImgText>
              </UpladBox>
            </ImgBox>
            {!url && (
              <UpladBox>
                <input id="fileUpload" type="file" hidden accept=".jpg, .jpeg, .png, .svg" />
                <CameraIconSVG />
                <UploadImgText>{t('Guild.upload')}</UploadImgText>
              </UpladBox>
            )}
          </BtnBox>
          <RightContent>
            <UlBox>
              <li>
                <div className="title">{t('Guild.ProjectName')}</div>
                <InputBox>
                  <Form.Control
                    type="text"
                    placeholder={t('Guild.ProjectName')}
                    value={proName}
                    onChange={(e) => handleInput(e, 0, 'proName')}
                  />
                </InputBox>
              </li>
              <li>
                <div className="title">{t('Guild.Desc')}</div>
                <InputBox>
                  <Form.Control
                    placeholder=""
                    as="textarea"
                    rows={2}
                    value={desc}
                    onChange={(e) => handleInput(e, 0, 'desc')}
                  />
                </InputBox>
              </li>
              <li>
                <div className="title">{t('Guild.AssociatedProposal')}</div>
                <div>
                  {proList.map((item, index) => (
                    <ItemBox key={`mem_${index}`}>
                      <ProposalInputBox>
                        <Form.Control
                          type="text"
                          placeholder={`https://forum.seedao.xyz/thread/sip-...`}
                          value={item}
                          onChange={(e) => handleInput(e, index, 'proposal')}
                        />
                      </ProposalInputBox>
                      <PlusMinusButton
                        showMinus={!(!index && index === proList.length - 1)}
                        showPlus={index === proList.length - 1}
                        onClickMinus={() => removeItem(index, 'proposal')}
                        onClickPlus={() => handleAdd('proposal')}
                      />
                    </ItemBox>
                  ))}
                </div>
              </li>
              <li>
                <div className="title">{t('Guild.Members')}</div>
                <div>
                  {adminList.map((item, index) => (
                    <ItemBox key={`mem_${index}`}>
                      <MemberInputBox>
                        <Form.Control
                          type="text"
                          placeholder={t('Guild.AddMemberAddress')}
                          value={item}
                          onChange={(e) => handleInput(e, index, 'admin')}
                        />
                        <RoleSelect
                          width="120px"
                          options={roleOptions}
                          defaultValue={roleOptions[0]}
                          NotClear={true}
                          isSearchable={false}
                        />
                      </MemberInputBox>
                      <PlusMinusButton
                        showMinus={!(!index && index === adminList.length - 1)}
                        showPlus={index === adminList.length - 1}
                        onClickMinus={() => removeItem(index, 'admin')}
                        onClickPlus={() => handleAdd('admin')}
                      />
                    </ItemBox>
                  ))}
                </div>
              </li>
              <li>
                <div className="title">{t('Guild.Intro')}</div>
                <IntroBox>
                  <MarkdownEditor
                    value={intro}
                    onChange={(val) => {
                      setIntro(val);
                    }}
                  />
                </IntroBox>
              </li>
            </UlBox>
          </RightContent>
        </CardBody>
        <RhtBtnBox>
          <Button
            onClick={() => handleSubmit()}
            disabled={
              proName?.length === 0 ||
              (adminList?.length === 1 && adminList[0]?.length === 0) ||
              (proList?.length === 1 && proList[0]?.length === 0)
            }
          >
            {t('general.confirm')}
          </Button>
          <Button variant="light" style={{ width: '80px' }} onClick={handleBack}>
            {t('general.cancel')}
          </Button>
        </RhtBtnBox>
      </FlexBox>
    </OuterBox>
  );
}

const FlexBox = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const RhtBtnBox = styled.div`
  display: flex;
  flex-direction: column;
  .btn {
    margin-bottom: 20px;
  }
`;

const OuterBox = styled.div`
  box-sizing: border-box;
  min-height: 100%;
  ${ContainerPadding};
`;

const CardBody = styled.div`
  display: flex;
  gap: 32px;
  padding-bottom: 100px;
`;

const BtmBox = styled.div`
  margin-top: 10px;
  button {
    width: 76px;
    height: 34px;
    font-size: 14px;
  }
  button:first-child {
    margin-right: 16px;
  }
`;

const UlBox = styled.ul`
  display: flex;
  flex-direction: column;
  //gap: 40px;
  li {
    margin-bottom: 40px;
    .title {
      font-size: 16px;
      font-family: Poppins-SemiBold, Poppins;
      font-weight: 600;
      color: var(--bs-body-color_active);
      line-height: 22px;
      margin-bottom: 14px;
    }
  }
`;

const InputBox = styled(InputGroup)`
  width: 576px;
  height: 40px;
  @media (max-width: 870px) {
    width: 400px;
  }
`;

const ProposalInputBox = styled(InputBox)`
  width: 480px;
`;

const MemberInputBox = styled(InputBox)`
  width: 480px;
`;

const ItemBox = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackBox = styled.div`
  width: 100%;
  display: inline-flex;
  align-items: center;
  margin-bottom: 48px;
  cursor: pointer;

  svg {
    margin-right: 10px;
  }
`;

const BtnBox = styled.label`
  background: var(--bs-box--background);
  height: 110px;
  width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-weight: 700;
  font-size: 14px;
  position: relative;
  overflow: hidden;
  .iconRht {
    margin-right: 10px;
  }
  img {
    max-width: 100%;
    max-height: 100%;
  }
  .uploadIcon {
    font-size: 20px;
    margin-right: 10px;
  }
`;

const CancelButton = styled.button`
  background: #b0b0b0;
  height: 34px;
  border: none;
  border-radius: 8px;
`;

const ImgBox = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  img {
    width: 100%;
    height: 100%;
    object-position: center;
    object-fit: cover;
  }
  .upload {
    display: none;
  }
  &:hover .upload {
    display: flex;
  }
`;

const IntroBox = styled.div`
  .cm-scroller,
  .md-editor-preview-wrapper {
    background: var(--bs-background);
  }
`;

const RightContent = styled.div`
  width: 576px;
  @media (max-width: 870px) {
    width: 400px;
  }
`;

const UpladBox = styled.div<{ bg?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  cursor: pointer;
  background: ${(props) => props.bg};
`;

const UploadImgText = styled.p`
  font-size: 12px;
  font-family: Poppins-Regular, Poppins;
  font-weight: 400;
  color: var(--bs-svg-color);
  line-height: 12px;
`;

const RoleSelect = styled(SeeSelect)`
  .react-select__control {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;
