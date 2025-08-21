import React, { useState, useEffect } from "react"
import { analyzeSymptoms } from './Api'
import './SymptomForm.css'
import { SYMPTOM_SUGGESTION } from "./Symptoms"

function SymptomForm() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('phi3');
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('darkMode') === 'true'
  );

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [typingResponse, setTypingResponse] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');

  const [suggestions, setSuggestions] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle dark mode
  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  }, [history]);

  const handleSymptomChange = (e) => {
    const input = e.target.value;
    setSymptoms(input);

    if (!input.trim()){
        setSuggestions([]);
        setShowSuggestions(false);
        return;
    }

    const filtered = SYMPTOM_SUGGESTION.filter(sym => 
        sym.toLowerCase().startsWith(input.toLowerCase())
    );

    setSuggestions(filtered.slice(0,5));
    setShowSuggestions(true);
    setActiveSuggestion(-1);
  };

  const handleSuggestionClick = (text) => {
    setSymptoms(text);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key==='ArrowDown'){
        setActiveSuggestion((prev) => Math.min(prev+1, suggestions.length-1));
    }
    else if (e.key==='ArrowUp'){
        setActiveSuggestion((prev) => Math.min(prev-1, 0));
    }
    else if (e.key==='Enter' && activeSuggestion>=0){
        setSymptoms(suggestions[activeSuggestion]);
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const handleSubmit = async () => {
    const currentSymptoms = symptoms.trim();
    if (!currentSymptoms) return;

    setLoading(true);
    setTypingResponse('');
    setCurrentMessage(currentSymptoms);
    setSymptoms('');

    try {
      const res = await analyzeSymptoms(currentSymptoms, model);
      const fullResponse = res.data.response || 'No response received.';

      let index = 0;
      const interval = setInterval(() => {
        setTypingResponse(prev => prev + fullResponse[index]);
        index++;
        if (index >= fullResponse.length) {
          clearInterval(interval);
          setHistory(prev => [...prev, { symptoms: currentSymptoms, response: fullResponse }]);
          setTypingResponse('');
          setCurrentMessage('');
        }
      }, 20);
    } catch (err) {
      const errorMsg = 'Error: ' + err.message;
      setHistory(prev => [...prev, { symptoms: currentSymptoms, response: errorMsg }]);
      setTypingResponse('');
      setCurrentMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className="container">
      <div className="header-bar">
        <h2>Offline Medical Symptoms Bot</h2>
        <div className="top-controls">
          <label>
            Dark Mode
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(prev => !prev)}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
          <button className="clear-btn" onClick={handleClearHistory}>Clear</button>
        </div>
      </div>

      <label>Enter Your Symptoms:</label>
      <textarea
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        rows={6}
        placeholder="e.g. sore throat, fever, headache..."
      />

      {showSuggestions && suggestions.length>0 && (
        <ul className="suggestion-list">
            {suggestions.map((symptom, index) => (
                <li key={index} className={`suggestion-item ${index===activeSuggestion ? 'active':''}`} onClick={() => handleSuggestionClick(symptom)}>
                    {symptom}
                </li>
            ))}
        </ul>
      )}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      <div className="chat-area">
        {history.map((entry, index) => (
          <div className="chat-message" key={index}>
            <div className="bubble user-bubble">{entry.symptoms}</div>
            <div className="bubble bot-bubble">{entry.response}</div>
          </div>
        ))}

        {typingResponse && (
          <div className="chat-message">
            <div className="bubble user-bubble">{currentMessage}</div>
            <div className="bubble bot-bubble typing">{typingResponse}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SymptomForm;