import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CreateEvent } from './pages/CreateEvent';
import { EventPage } from './pages/EventPage';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateEvent />} />
        <Route path="/new" element={<CreateEvent />} />
        <Route path="/event/:eventId" element={<EventPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
