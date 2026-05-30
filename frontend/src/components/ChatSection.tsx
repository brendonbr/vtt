import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { WS_BASE } from './vtt/vttConfig'

function ChatSection({ messages, setMessages }) {
  const [input, setInput] = useState('')
  const wsRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws`)
    wsRef.current = ws
    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }
    ws.onerror = () => {
      setMessages(prev => [...prev, 'Chat connection unavailable.'])
    }
    return () => {
      wsRef.current = null
      ws.close()
    }
  }, [setMessages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text)
      setInput('')
    } else {
      setMessages(prev => [...prev, 'Chat is not connected.'])
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-layout">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <p key={i}>
              {msg}
            </p>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Message the table"
          />
          <button onClick={sendMessage} type="button" title="Send message">
            <Send size={17} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatSection
