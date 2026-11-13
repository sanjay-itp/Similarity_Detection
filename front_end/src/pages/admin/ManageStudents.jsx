import { api } from '../../api';
import { useAsync } from '../../utils/useAsync';
import { Card, ErrorBox, PageHeader, Spinner } from '/components/ui';
import UserTable from './UserTable';

export default function ManageStudents() {
  const students = useAsync(() => api.listUsers('student'), []);
  return (
    <>
      <PageHeader title="Students" subtitle="Students register themselves. You can deactivate, reset or remove accounts here." />
      <Card>
        <ErrorBox error={students.error} onRetry={students.reload} />
        {students.loading ? <Spinner /> : <UserTable users={students.data || []} role="student" onChange={students.setData} />}
      </Card>
    </>
  );
}
