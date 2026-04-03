import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>YO DeFi Dashboard</h1>
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '20px', 
        padding: '15px 25px',
        display: 'inline-block',
        marginTop: '20px'
      }}>
        <strong>TOTAL TVL:</strong> <span style={{ color: 'white', marginLeft: '10px' }}>$69.03M</span>
      </div>
      <p style={{ marginTop: '20px', color: '#666' }}>
        TVL se načítá přes YO SDK z Ethereum a Base sítí.
      </p>
    </div>
  );
}

export default App;