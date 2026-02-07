import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [isLocal, setIsLocal] = useState(true);

  useEffect(() => {
    setIsLocal(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]">S</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">SSTI <span className="text-indigo-500">大师</span></h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">安全 Payload 锻造炉</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4">
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${isLocal ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {isLocal ? '本地模式' : '云端访问'}
          </div>
          
          <button 
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-xs text-zinc-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            启动指南
          </button>
        </nav>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass max-w-lg w-full rounded-2xl p-8 shadow-2xl border-indigo-500/20 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">🚀 启动与部署说明</h3>
              <button onClick={() => setShowGuide(false)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-400 mb-2">方式一：本地极速运行</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  解压所有文件，在 Windows 上双击 <strong>start-app.bat</strong> 即可。系统将自动寻找 Python 或 Node.js 环境并为你开启服务。
                </p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-black/20 p-2 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  请勿直接双击 index.html，浏览器会拦截脚本加载。
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <h4 className="text-sm font-bold text-zinc-300 mb-2">方式二：零成本云端部署</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  推荐使用 <strong>Vercel</strong> 或 <strong>Netlify</strong>。只需将本文件夹拖入其上传窗口，即可获得一个永久访问的 HTTPS 网址，无需本地搭建环境。
                </p>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <h4 className="text-sm font-bold text-zinc-300 mb-2">方式三：安装 PWA</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  如果您已经在浏览器中正常看到此页面，请点击地址栏右侧的“安装”按钮。它会创建一个桌面图标，以后可以像 EXE 一样直接打开。
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              了解，开始使用
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;