import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CreateRoom from "../src/components/CreateRoom";
import Room from "../src/components/Room";
import './App.css';


function App () {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route exact path="/" element={ <CreateRoom /> } />
          <Route path="/room/:roomID" element={ <Room /> } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
