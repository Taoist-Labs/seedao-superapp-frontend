import React, { useEffect, useState } from 'react';
import { Row, Col, Tabs, Tab, Card } from 'react-bootstrap';
import styled from 'styled-components';
// import { useRouter } from 'next/router';
import Info from 'components/guild/info';
import Members from 'components/guild/members';
import Assets from 'components/guild/assets';
import ProjectProposal from 'components/guild/proposal';
import Reg from 'components/guild/reg';
// import { EvaIcon } from '@paljs/ui/Icon';
import { getProjectById } from 'requests/guild';
import { ReTurnProject } from 'type/project.type';
import { useTranslation } from 'react-i18next';
import { AppActionType, useAuthContext } from 'providers/authProvider';
import { listObj } from 'pages/project';
import useCheckLogin from 'hooks/useCheckLogin';
import usePermission from 'hooks/usePermission';
import { PermissionObject, PermissionAction } from 'utils/constant';
import { useNavigate, useParams } from 'react-router-dom';

const Box = styled.div`
  position: relative;
  .tab-content {
    padding: 0 !important;
  }
`;

const CardBox = styled(Card)`
  min-height: 85vh;
`;

const TopBox = styled.div`
  padding: 20px;
`;

const BackBox = styled.div`
  padding: 30px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  .icon {
    font-size: 24px;
  }
`;

const BtmBox = styled.div``;
export default function Index() {
  // const router = useRouter();
  const { t } = useTranslation();
  const isLogin = useCheckLogin();
  const { dispatch } = useAuthContext();
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReTurnProject | undefined>();
  const [current, setCurrent] = useState<number>(0);
  const [list, setList] = useState<listObj[]>([]);

  const canAuditApplication = usePermission(PermissionAction.CreateApplication, PermissionObject.GuildPrefix + id);

  useEffect(() => {
    if (!id) return;
    getDetail();
  }, [id]);

  const getDetail = async () => {
    dispatch({ type: AppActionType.SET_LOADING, payload: true });
    const dt = await getProjectById(id as string);
    dispatch({ type: AppActionType.SET_LOADING, payload: null });
    setDetail(dt.data);
  };

  const selectCurrent = (e: number) => {
    setCurrent(Number(e));
  };

  useEffect(() => {
    const _list = [
      {
        name: t('Guild.ProjectInformation'),
        id: 0,
      },
      {
        name: t('Guild.Members'),
        id: 1,
      },
      {
        name: t('Guild.Asset'),
        id: 2,
      },
      {
        name: t('Guild.ProjectProposal'),
        id: 3,
      },
    ];
    if (isLogin && canAuditApplication) {
      _list.push({
        name: t('Guild.Add'),
        id: 4,
      });
    }
    setList(_list);
  }, [t, isLogin, canAuditApplication]);

  const updateProjectName = (value: string) => {
    if (detail) {
      setDetail({ ...detail, name: value });
    }
  };
  return (
    <div>
      <CardBox>
        <Box>
          <BackBox onClick={() => navigate(-1)}>
            {/*<EvaIcon name="chevron-left-outline" className="icon" /> */}
            <span> {t('general.back')}</span>
          </BackBox>
          <Row>
            <Col breakPoint={{ xs: 12 }}>
              <TopBox>
                <Tabs defaultActiveKey={0} onSelect={(e: any) => selectCurrent(e)}>
                  {list.map((item, index) => (
                    <Tab key={item.id} title={item.name} eventKey={index} />
                  ))}
                </Tabs>
                <BtmBox>
                  {current === 0 && (
                    <Info detail={detail} updateProjectName={updateProjectName} updateProject={getDetail} />
                  )}
                  {current === 1 && <Members detail={detail} updateProject={getDetail} />}
                  {current === 2 && <Assets id={projectId} detail={detail} />}
                  {current === 3 && <ProjectProposal detail={detail} refreshProject={getDetail} />}
                  {current === 4 && <Reg id={projectId} />}
                </BtmBox>
              </TopBox>
            </Col>
          </Row>
        </Box>
      </CardBox>
    </div>
  );
}