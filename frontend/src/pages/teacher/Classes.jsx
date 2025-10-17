import Section from '../../components/ui/Section';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/ui.css';

export default function ClassesPage() {
  const navigate = useNavigate();

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Classes</h3>
        <div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/education/teacher/classes/create-class')}>Create class</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <p>This page will be the classes management dashboard. Use the Create button to add a new class.</p>
      </div>
    </Card>
  );
}
