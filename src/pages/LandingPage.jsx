import React from 'react';

const LandingPage = ({ onLaunch }) => {
  return (
    <div className="bg-[#111921] text-white font-sans selection:bg-[#207fdf] selection:text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 px-6 lg:px-10 bg-[#121a21]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 text-[#207fdf]">
          <span className="material-symbols-outlined text-[28px]">waves</span>
          <h1 className="text-xl font-bold tracking-tight text-white">SimuLab</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-sm font-medium text-slate-300 hover:text-[#207fdf] transition-colors" href="#">Features</a>
          <a className="text-sm font-medium text-slate-300 hover:text-[#207fdf] transition-colors" href="#">Library</a>
          <a className="text-sm font-medium text-slate-300 hover:text-[#207fdf] transition-colors" href="#">Community</a>
        </nav>
        <div className="flex items-center gap-4">
          <a className="text-sm font-bold text-white hover:text-[#207fdf] hidden sm:block" href="#">Log in</a>
          <button 
            onClick={onLaunch}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#207fdf] hover:bg-blue-600 text-white h-9 px-5 text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
          >
            Launch Simulator
          </button>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 px-6 lg:px-10 border-b border-slate-800 overflow-hidden">
          <div className="mx-auto max-w-4xl text-center relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-bold uppercase tracking-wider text-[#207fdf] mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Free for everyone
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              The Ultimate Electronics <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#207fdf] to-blue-400">Simulator</span> Project
            </h1>
            <p className="text-lg md:text-xl text-[#95adc6] max-w-2xl mb-10 leading-relaxed">
              Design, simulate, and share physical electronic component circuits directly in your browser. Professional grade tools, zero cost.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={onLaunch} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[#207fdf] hover:bg-blue-600 text-white h-12 px-8 text-base font-bold shadow-xl shadow-blue-900/20 transition-all">
                <span className="material-symbols-outlined">play_circle</span>
                Start Simulating
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[#253646] hover:bg-[#324555] text-white h-12 px-8 text-base font-bold transition-all border border-slate-700">
                <span className="material-symbols-outlined">menu_book</span>
                View Documentation
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-slate-800 bg-[#151e29]">
          <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-white mb-1">Free</div>
              <div className="text-sm font-medium text-[#95adc6]">For Everyone</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white mb-1">100+</div>
              <div className="text-sm font-medium text-[#95adc6]">Components</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white mb-1">Web</div>
              <div className="text-sm font-medium text-[#95adc6]">Based Platform</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white mb-1">Real-time</div>
              <div className="text-sm font-medium text-[#95adc6]">Physics Engine</div>
            </div>
          </div>
        </section>

        {/* Available Models Section */}
        <section className="py-20 px-6 lg:px-10 bg-[#111921]">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Available Models</h2>
              <p className="text-[#95adc6] max-w-2xl mx-auto">Access a wide range of simulated components, from powerful microcontrollers to essential peripherals.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { name: 'ESP32', desc: 'Dual-core WiFi/BT', icon: 'developer_board', color: 'blue' },
                { name: 'Raspberry Pi', desc: 'Pico & Zero Boards', icon: 'memory', color: 'green' },
                { name: 'Arduino', desc: 'Uno & Mega Boards', icon: 'settings_input_component', color: 'cyan' },
                { name: 'Sensors', desc: 'Temp, Motion, Gas', icon: 'sensors', color: 'purple' },
                { name: 'Displays', desc: 'OLED, LCD, TFT', icon: 'grid_view', color: 'orange' },
                { name: 'Power', desc: 'Motors & Servos', icon: 'electric_bolt', color: 'red' }
              ].map((model) => (
                <div key={model.name} className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#1a2632] border border-slate-800 hover:border-[#207fdf]/50 transition-all hover:shadow-lg text-center group cursor-pointer">
                  <div className={`w-12 h-12 rounded-full bg-${model.color}-900/30 text-${model.color}-400 flex items-center justify-center`}>
                    <span className="material-symbols-outlined">{model.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-[#207fdf] transition-colors">{model.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{model.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured IoT Projects */}
        <section className="py-20 px-6 lg:px-10 border-y border-slate-800 bg-[#151e29]">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Featured IoT Projects</h2>
                <p className="text-[#95adc6]">Explore connected devices and smart systems built by the community.</p>
              </div>
              <a className="text-[#207fdf] font-bold hover:text-blue-400 flex items-center gap-1" href="#">
                Browse IoT Gallery <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Smart Weather Station', tag: 'WiFi', desc: 'A complete ESP32-based weather monitoring system using DHT22 and BMP180 sensors.', color: 'blue', img: 'https://images.unsplash.com/photo-1555664424-778a69022365?q=80&w=1000&auto=format&fit=crop', lang: 'ESP32 • C++' },
                { title: 'Home Security System', tag: 'Automation', desc: 'Simulated alarm system with PIR motion sensors, keypad matrix, and LCD status display.', color: 'purple', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop', lang: 'Arduino • Wiring' },
                { title: 'Remote Robot Arm', tag: 'Control', desc: 'Multi-servo robotic arm controller using PWM signals and potentiometer inputs.', color: 'green', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop', lang: 'Pico • MicroPython' }
              ].map((project) => (
                <div key={project.title} className="group relative rounded-2xl overflow-hidden bg-[#1a2632] border border-slate-700 shadow-md">
                  <div className="aspect-[4/3] w-full relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br from-${project.color}-900/40 to-slate-900/90 z-10`}></div>
                    <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${project.img})` }}></div>
                    <div className="absolute top-4 left-4 z-20">
                      <span className={`px-2.5 py-1 rounded bg-${project.color}-500/20 border border-${project.color}-500/30 text-${project.color}-300 text-xs font-bold uppercase tracking-wide backdrop-blur-md`}>{project.tag}</span>
                    </div>
                  </div>
                  <div className="p-6 relative z-20">
                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-sm text-[#95adc6] mb-4">{project.desc}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <span className="text-xs font-mono text-slate-400">{project.lang}</span>
                      <span className="text-[#207fdf] text-sm font-bold group-hover:underline cursor-pointer">View Project</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Simulation Projects */}
        <section className="py-20 px-6 lg:px-10 bg-[#111921]">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Featured Simulation Projects</h2>
                <p className="text-[#95adc6]">Dive deep into circuit theory and digital logic designs.</p>
              </div>
              <a className="text-[#207fdf] font-bold hover:text-blue-400 flex items-center gap-1" href="#">
                View Public Library <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: '555 Timer Astable', tag: 'Analog', desc: 'Master timing circuits with this classic integrated circuit configuration.', color: 'blue', id: 0 },
                { title: '8-Bit Architecture', tag: 'Processor', desc: 'Visualize data flow and logic gates in a complex processor design.', color: 'purple', id: 1 },
                { title: 'Logic Gate Arrays', tag: 'Digital', desc: 'Build complex digital logic systems using basic gates and flip-flops.', color: 'orange', id: 2 }
              ].map((sim) => (
                <div key={sim.title} className="group flex flex-col gap-3 p-4 rounded-xl bg-[#1a2632] border border-slate-800 hover:border-[#207fdf]/50 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div className="w-full bg-[#121a21] aspect-video rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(http://googleusercontent.com/profile/picture/${sim.id})` }}></div>
                    <div className={`absolute top-3 left-3 bg-${sim.color}-500/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider`}>{sim.tag}</div>
                  </div>
                  <div className="px-1 pb-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#207fdf] transition-colors">{sim.title}</h3>
                    <p className="text-sm text-[#95adc6] mt-2">{sim.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-6 lg:px-10 border-t border-slate-800 bg-[#151e29]">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-6">Ready to start simulating?</h2>
            <p className="text-lg text-[#95adc6] mb-10">Join thousands of engineers, students, and hobbyists building the future.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={onLaunch} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[#207fdf] hover:bg-blue-600 text-white h-14 px-10 text-lg font-bold shadow-xl shadow-blue-900/20 transition-all">
                Create Free Account
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-transparent hover:bg-[#253646] text-white h-14 px-10 text-lg font-bold border border-slate-700 transition-all">
                Browse Examples
              </button>
            </div>
            <p className="mt-6 text-xs text-slate-500">No credit card required. Free for everyone forever.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#111921] py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-[24px]">waves</span>
            <span className="font-bold text-lg">SimuLab</span>
          </div>
          <div className="text-sm text-slate-600">© 2026 SimuLab Project. All rights reserved.</div>
          <div className="flex gap-6">
            <a className="text-slate-400 hover:text-[#207fdf] transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
            <a className="text-slate-400 hover:text-[#207fdf] transition-colors" href="#"><span className="material-symbols-outlined">mail</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;