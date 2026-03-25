import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/home';

function App(): React.JSX.Element {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </MemoryRouter>
  );
}

export default App;
