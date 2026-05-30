          <section className="rounded-[2rem] border border-[#333] bg-secondary p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <h2 className="mb-4 text-2xl font-semibold text-primary">Chat</h2>
            <div className="space-y-4">
              <div className="chat-messages min-h-[240px] overflow-y-auto rounded-3xl border border-[#444] bg-background p-4 space-y-3">
                {messages.map((msg, i) => (
                  <p key={i} className="rounded-2xl bg-secondary p-3 text-sm leading-6 text-text">
                    {msg}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  className="flex-1 rounded-2xl border border-[#444] bg-background px-4 py-3 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <button onClick={sendMessage} className="rounded-2xl bg-primary px-5 py-3 text-background font-semibold transition hover:bg-accent">
                  Send
                </button>
              </div>
            </div>
          </section>