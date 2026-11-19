import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { Card, ErrorBox, PageHeader, Spinner } from '../../components/ui';
import Icon from '../../components/Icon';
import UserTable from './UserTable';
import NewAccountModal from './NewAccountModal';

export default function ManageTeachers() {
  const [params, setParams] = useSearchParams();
  const teachers = useAsync(() => api.listUsers('teacher'), []);
  const [open, setOpen] = useState(params.get('new') === '1');

  const close = () => {
    setOpen(false);
    if (params.get('new')) setParams({});
  };

  return (
    <>
      <PageHeader
        title="Teachers"
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" /> New teacher
          </button>
        }
      />
      <Card padded>
        <ErrorBox error={teachers.error} onRetry={teachers.reload} />
        {teachers.loading ? <Spinner /> : <UserTable users={teachers.data || []} role="teacher" onChange={teachers.setData} />}
      </Card>

      {open && (
        <NewAccountModal
          role="teacher"
          onClose={close}
          onCreated={(t) => teachers.setData((list) => [...(list || []), { ...t, courseCount: 0 }])}
        />
      )}
    </>
  );
}
