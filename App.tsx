
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import { TEMPLATE_ENGINES, COMMON_RESTRICTIONS } from './constants';
import { TemplateEngine, GeneratedPayload, PayloadRequest, HistoryItem, CodeAnalysisResponse, CodeAnalysisRequest } from './types';
import { generateSSTIPayload, analyzeSourceCode } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'auditor'>('generator');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Generator State
  const [selectedEngine, setSelectedEngine] = useState<TemplateEngine>('Jinja2');
  const [goal, setGoal] = useState('远程代码执行 (RCE)');
  const [specificCommand, setSpecificCommand] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [customRules, setCustomRules] = useState('');
  const [blockedPatterns, setBlockedPatterns] = useState('');
  const [genResult, setGenResult] = useState<GeneratedPayload | null>(null);

  // Auditor State
  const [sourceCode, setSourceCode] = useState('');
  const [auditResult, setAuditResult] = useState<CodeAnalysisResponse | null>(null);

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // PWA Install logic
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('ssti_master_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ssti_master_history', JSON.stringify(history));
  }, [history]);

  const toggleRestriction = (id: string) => {
    setRestrictions(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payloadReq: PayloadRequest = {
        engine: selectedEngine,
        goal,
        specificCommand: specificCommand.trim() || undefined,
        restrictions,
        customWafRules: customRules,
        blockedPatterns: blockedPatterns.trim() || undefined
      };
      const response = await generateSSTIPayload(payloadReq);
      setGenResult(response);

      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        request: payloadReq,
        response: response,
        type: 'generator'
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
    } catch (err) {
      setError('Payload 生成失败。模型可能无法针对此 WAF 规则找到有效的绕过方案。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!sourceCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const auditReq: CodeAnalysisRequest = { sourceCode };
      const response = await analyzeSourceCode(auditReq);
      setAuditResult(response);

      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        request: auditReq,
        response: response,
        type: 'auditor'
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
    } catch (err) {
      setError('源代码审计失败。模型在深度追踪污染链时遇到阻碍，请确保代码逻辑的可读性。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setActiveTab(item.type);
    if (item.type === 'generator') {
      const req = item.request as PayloadRequest;
      const res = item.response as GeneratedPayload;
      setSelectedEngine(req.engine);
      setGoal(req.goal);
      setSpecificCommand(req.specificCommand || '');
      setRestrictions(req.restrictions);
      setCustomRules(req.customWafRules);
      setBlockedPatterns(req.blockedPatterns || '');
      setGenResult(res);
    } else {
      const req = item.request as CodeAnalysisRequest;
      const res = item.response as CodeAnalysisResponse;
      setSourceCode(req.sourceCode);
      setAuditResult(res);
    }
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已成功复制到剪贴板！');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 selection:bg-indigo-500/30">
      <Header />
      
      {/* PWA Install Notification */}
      {deferredPrompt && (
        <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between text-white text-xs font-bold animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            想在桌面上像 EXE 一样运行它吗？
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-indigo-600 px-3 py-1 rounded shadow-sm hover:bg-zinc-100 transition-colors uppercase"
          >
            立即安装
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧控制面板与历史 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setActiveTab('generator')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'generator' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Payload 生成器
            </button>
            <button 
              onClick={() => setActiveTab('auditor')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'auditor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              源码漏洞审计
            </button>
          </div>

          {activeTab === 'generator' ? (
            <section className="glass rounded-xl p-6 shadow-2xl border-indigo-500/20 border space-y-5 animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                参数配置
              </h2>
              
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">模板引擎</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEMPLATE_ENGINES.map(engine => (
                    <button
                      key={engine}
                      onClick={() => setSelectedEngine(engine)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                        selectedEngine === engine 
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {engine}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">攻击目标</label>
                  <select 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option>远程代码执行 (RCE)</option>
                    <option>读取文件 / 系统信息</option>
                    <option>环境变量泄露</option>
                    <option>带外 (OOB) 盲注</option>
                    <option>信息泄露 (config/settings)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">执行特定命令</label>
                  <input
                    type="text"
                    placeholder="例如: cat /etc/passwd"
                    value={specificCommand}
                    onChange={(e) => setSpecificCommand(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">WAF 快速拦截项</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_RESTRICTIONS.map(res => (
                    <button
                      key={res.id}
                      onClick={() => toggleRestriction(res.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        restrictions.includes(res.label)
                          ? 'bg-red-500/10 border-red-500 text-red-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">特定黑名单字符串 / 正则模式</label>
                  <textarea
                    placeholder="输入具体的黑名单字符、关键字或正则。例如: os, import, system, \d{3}..."
                    value={blockedPatterns}
                    onChange={(e) => setBlockedPatterns(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-xs mono focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">WAF 特征 / 启发式行为</label>
                  <textarea
                    placeholder="例如: 长度限制 120 字符, 必须包含 'user', 拦截所有大写字母..."
                    value={customRules}
                    onChange={(e) => setCustomRules(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-xs mono focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group"
              >
                {loading ? "正在锻造..." : "生成绕过 Payload"}
              </button>
            </section>
          ) : (
            <section className="glass rounded-xl p-6 shadow-2xl border-indigo-500/20 border space-y-5 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                  源代码审计
                </h2>
                <div className="flex items-center gap-2">
                   <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                   <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded uppercase font-bold tracking-tighter">Deep Trace v2.0</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">输入源码 (支持长文本分析)</label>
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="在此粘贴包含模板引擎调用的源码片段。系统将进行深度语义分析并追踪污点流向..."
                  className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-xs mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                />
              </div>
              <button
                onClick={handleAudit}
                disabled={loading || !sourceCode.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    正在穿透链式调用与包装函数...
                  </span>
                ) : "开始深度源码审计"}
              </button>
            </section>
          )}

          <section className="glass rounded-xl p-6 border border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>历史记录</span>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{history.length} / 20</span>
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="group bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{item.type === 'generator' ? 'Payload' : '审计'}</span>
                    <button onClick={(e) => deleteHistoryItem(item.id, e)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-opacity">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <div className="text-xs text-zinc-400 truncate mt-1">
                    {item.type === 'generator' ? (item.response as GeneratedPayload).payload : '源码片段高精度审计结果'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 右侧结果面板 */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}

          {activeTab === 'generator' ? (
            genResult ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass rounded-xl overflow-hidden border border-indigo-500/30">
                  <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                      生成的 Payload
                    </span>
                    <button onClick={() => copyToClipboard(genResult.payload)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
                      复制
                    </button>
                  </div>
                  <div className="p-6 bg-zinc-950/80">
                    <pre className="mono text-indigo-200 text-sm whitespace-pre-wrap break-all leading-relaxed p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      {genResult.payload}
                    </pre>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 border border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    对象内省链 (污染链)
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {genResult.pollutionChain.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-300">
                          {step}
                        </div>
                        {idx < genResult.pollutionChain.length - 1 && <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass rounded-xl p-6 border border-zinc-800">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">绕过技术说明</h4>
                    <span className="inline-block px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded text-[10px] font-bold text-indigo-400 uppercase mb-3">
                      {genResult.bypassTechnique}
                    </span>
                    <p className="text-zinc-400 text-sm leading-relaxed">{genResult.explanation}</p>
                  </div>
                  <div className="glass rounded-xl p-6 border border-zinc-800 flex flex-col justify-center items-center text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c0 4.835 1.503 9.359 4.07 13.04a11.991 11.991 0 0013.158 0c2.567-3.681 4.07-8.205 4.07-13.04z"/></svg>
                    </div>
                    <h5 className="text-sm font-bold text-zinc-300">安全防护提示</h5>
                    <p className="text-xs text-zinc-500">生产环境建议开启沙箱模式并严格过滤输入属性。</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-zinc-800 rounded-3xl">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.414 1.414a2 2 0 002.828 0l1.414-1.414a2 2 0 000-2.828l-1.414-1.414zM10.5 3.5a1 1 0 112 0v1a1 1 0 11-2 0v-1zM5 10.5a1 1 0 110 2H4a1 1 0 110-2h1zM19 10.5a1 1 0 110 2h1a1 1 0 110-2h-1zM10.5 19a1 1 0 112 0v1a1 1 0 11-2 0v-1zM6.343 6.343a1 1 0 111.414 1.414L7.05 8.464a1 1 0 11-1.414-1.414l.707-.707zM16.243 16.243a1 1 0 111.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM6.343 17.657a1 1 0 11-1.414-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707zM17.657 6.343a1 1 0 111.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707z"/></svg>
                </div>
                <h3 className="text-zinc-400 font-medium text-lg">等待参数输入</h3>
                <p className="text-zinc-600 text-sm max-w-xs">设置目标引擎和 WAF 拦截规则后，点击按钮开始生成绕过 Payload。</p>
              </div>
            )
          ) : (
            auditResult ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`glass rounded-xl p-6 border ${auditResult.vulnerabilityFound ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${auditResult.vulnerabilityFound ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                    <h3 className="text-lg font-bold">审计状态: {auditResult.vulnerabilityFound ? '发现高危漏洞' : '未发现明显漏洞'}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase block mb-1">检测到引擎</span>
                      <span className="text-xs font-bold text-zinc-200">{auditResult.engineDetected}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase block mb-1">漏洞汇聚点 (Sink)</span>
                      <span className="text-xs font-bold text-red-400 font-mono truncate block">{auditResult.sinkPoint}</span>
                    </div>
                  </div>
                </div>

                {auditResult.vulnerabilityFound && (
                  <>
                    <div className="glass rounded-xl p-6 border border-zinc-800">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                          精确污点追踪链 (Source-to-Sink)
                        </h4>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Enhanced Taint Analysis v2</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {auditResult.pollutionChain.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-300 shadow-inner">
                              {step}
                            </div>
                            {idx < auditResult.pollutionChain.length - 1 && <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="glass rounded-xl p-6 border border-zinc-800">
                      <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">漏洞验证 Payload (PoC)</h4>
                      <div className="space-y-3">
                        {auditResult.suggestedPayloads.map((payload, idx) => (
                          <div key={idx} className="flex gap-2">
                            <pre className="flex-1 mono text-xs p-3 bg-zinc-900 rounded-lg border border-zinc-800 overflow-x-auto shadow-inner">{payload}</pre>
                            <button onClick={() => copyToClipboard(payload)} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] border border-zinc-700 transition-colors">复制</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass rounded-xl p-6 border border-zinc-800">
                      <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">深度技术分析</h4>
                      <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{auditResult.description}</p>
                    </div>

                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c0 4.835 1.503 9.359 4.07 13.04a11.991 11.991 0 0013.158 0c2.567-3.681 4.07-8.205 4.07-13.04z"/></svg>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-emerald-400">推荐修复方案 (Remediation)</h5>
                        <p className="text-xs text-emerald-600/80 mt-1.5 leading-relaxed">{auditResult.remediation}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-zinc-800 rounded-3xl">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                </div>
                <h3 className="text-zinc-400 font-medium text-lg">等待源码分析</h3>
                <p className="text-zinc-600 text-sm max-w-xs">在左侧输入包含模板引擎逻辑的源码，点击“开始深度源码审计”以自动追踪污染链并发现潜在漏洞。</p>
              </div>
            )
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
};

export default App;
