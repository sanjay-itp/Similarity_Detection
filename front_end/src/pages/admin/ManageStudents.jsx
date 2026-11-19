import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { Card, ErrorBox, PageHeader, Spinner } from '../../components/ui';
import Icon from '../../components/Icon';
import UserTable from './UserTable';
import NewAccountModal from './NewAccountModal';

export default function ManageStudents() {
  const [params, setParams] = useSearchParams();
  const students = useAsync(() => api.listUsers('student'), []);
  const [open, setOpen] = useState(params.get('new') === '1');

  const close = () => {
    setOpen(false);
    if (params.get('new')) setParams({});
  };

  return (
    <>
      <PageHeader
        title="Students"
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" /> New student
          </button>
        }
      />
      <Card padded>
        <ErrorBox error={students.error} onRetry={students.reload} />
        {students.loading ? <Spinner /> : <UserTable users={students.data || []} role="student" onChange={students.setData} />}
      </Card>

      {open && (
        <NewAccountModal
          role="student"
          onClose={close}
          onCreated={(s) => students.setData((list) => [...(list || []), { ...s, submissionCount: 0 }])}
        />
      )}
    </>
  );
}
