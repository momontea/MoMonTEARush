
import React, { useState, useEffect } from 'react';
import { Play, Gift, X, Wallet, Trash2, HelpCircle, Zap, Shield, Snowflake, CheckCircle, Copy } from 'lucide-react';
import { REWARD_TIERS } from '../constants';
import { AudioService } from '../services/audioService';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
}

interface SavedCoupon {
  id: string;
  name: string;
  tier: string;
  code: string;
  value: string;
  createdAt: number;
  expiresAt: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  const [showRewards, setShowRewards] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [coupons, setCoupons] = useState<SavedCoupon[]>([]);
  const [redeemId, setRedeemId] = useState<string | null>(null);

  useEffect(() => {
      if (showWallet) {
          loadCoupons();
      }
  }, [showWallet]);

  const handleStart = () => {
      AudioService.init();
      onStart();
  };

  const loadCoupons = () => {
      const saved = localStorage.getItem('momon_wallet');
      if (saved) {
          const parsed: SavedCoupon[] = JSON.parse(saved);
          setCoupons(parsed.sort((a, b) => b.createdAt - a.createdAt));
      }
  };

  const redeemCoupon = (id: string) => {
      const updated = coupons.filter(c => c.id !== id);
      setCoupons(updated);
      localStorage.setItem('momon_wallet', JSON.stringify(updated));
      setRedeemId(null);
      alert("¡Cupón canjeado exitosamente!");
  };

  const getTimeLeft = (expiresAt: number) => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) return "CADUCADO";
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-momon-yellow overflow-hidden">
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
            <div 
                key={i}
                className="absolute rounded-full bg-momon-red"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 40 + 10}px`,
                    height: `${Math.random() * 40 + 10}px`,
                    animation: `pulse ${Math.random() * 2 + 1}s infinite`
                }}
            />
        ))}
      </div>

      {/* Brand Character (CSS Representation of Logo) */}
      <div className="mb-4 relative group transform transition-transform duration-500 hover:scale-105 cursor-pointer" onClick={handleStart}>
        {/* Lid (Yellow) */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-44 h-16 bg-momon-yellow rounded-[50%] border-8 border-momon-black z-20 shadow-sm"></div>
        
        {/* Flat Leaf Design (SVG for accuracy - FIXED TO LAY FLAT) */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
            <svg width="100" height="60" viewBox="0 0 100 60" className="overflow-visible">
                 {/* A stylized, flat tea leaf shape that curves with the lid */}
                 <path 
                    d="M20,30 C20,30 40,15 50,15 C60,15 80,30 80,30 C80,30 60,45 50,45 C40,45 20,30 20,30 Z" 
                    fill="#3a935e" 
                    stroke="#231f20" 
                    strokeWidth="5"
                    strokeLinejoin="round"
                 />
                 {/* Center vein */}
                 <path
                    d="M30,30 C40,30 60,30 70,30"
                    stroke="#231f20"
                    strokeWidth="3"
                    fill="none"
                 />
            </svg>
        </div>

        {/* Cup Body (Red) */}
        <div className="w-40 h-48 bg-momon-red rounded-b-[3rem] border-8 border-momon-black relative overflow-hidden shadow-[10px_10px_0px_0px_rgba(35,31,32,1)] z-10 mt-4">
             {/* Shadow/Shine */}
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none"></div>
             
             {/* Mouth */}
             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-10 h-5 border-b-4 border-momon-black rounded-full"></div>
        </div>

        {/* The EYE (Cyclops Green) */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-30">
             {/* Sclera (White) */}
             <div className="w-28 h-28 bg-white rounded-full border-8 border-momon-black flex items-center justify-center shadow-sm relative">
                {/* Iris (Green) */}
                <div className="w-20 h-20 bg-momon-green rounded-full flex items-center justify-center border-2 border-black/10 relative">
                    {/* Pupil (Black) */}
                    <div className="w-10 h-10 bg-momon-black rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        {/* Glint (White) */}
                        <div className="absolute top-1 left-2 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                </div>
             </div>
        </div>
      </div>

      <h1 className="text-6xl font-black text-momon-black tracking-tight mb-1 drop-shadow-lg transform -rotate-2">
        MoMon
      </h1>
      <h2 className="text-4xl font-black text-momon-red tracking-widest mb-4 uppercase transform rotate-1">
        Tea Rush
      </h2>

      <div className="flex gap-2 mb-6 w-full max-w-xs">
        <div className="flex-1 bg-white border-4 border-momon-black p-1 rounded-xl shadow-[4px_4px_0px_0px_rgba(35,31,32,1)] flex flex-col items-center justify-center">
            <span className="text-[8px] font-black text-gray-400 uppercase">RÉCORD</span>
            <span className="text-lg font-black text-momon-green">{highScore}</span>
        </div>
        
        <button 
            onClick={() => setShowRewards(true)}
            className="flex-1 bg-blue-100 border-4 border-momon-black p-1 rounded-xl shadow-[4px_4px_0px_0px_rgba(35,31,32,1)] flex flex-col items-center justify-center hover:bg-blue-200 transition-colors"
        >
            <Gift className="w-4 h-4 mb-1 text-blue-600" />
            <span className="text-[8px] font-black text-blue-600 uppercase">NIVELES</span>
        </button>

        <button 
            onClick={() => setShowHelp(true)}
            className="flex-1 bg-yellow-100 border-4 border-momon-black p-1 rounded-xl shadow-[4px_4px_0px_0px_rgba(35,31,32,1)] flex flex-col items-center justify-center hover:bg-yellow-200 transition-colors"
        >
            <HelpCircle className="w-4 h-4 mb-1 text-orange-600" />
            <span className="text-[8px] font-black text-orange-600 uppercase">AYUDA</span>
        </button>
      </div>
      
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
            onClick={handleStart}
            className="group w-full bg-momon-green hover:bg-[#2e7a4b] text-white text-3xl font-black py-4 px-8 rounded-2xl border-4 border-momon-black shadow-[8px_8px_0px_0px_rgba(35,31,32,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Play fill="currentColor" className="w-8 h-8 relative z-10" />
            <span className="relative z-10">JUGAR</span>
        </button>

        <button
            onClick={() => setShowWallet(true)}
            className="group w-full bg-momon-black text-white text-xl font-black py-3 px-6 rounded-2xl border-4 border-momon-black shadow-[6px_6px_0px_0px_#ffffff50] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 relative overflow-hidden"
        >
            <Wallet className="w-6 h-6" />
            <span>MIS PREMIOS</span>
            {(() => {
                const saved = localStorage.getItem('momon_wallet');
                const count = saved ? JSON.parse(saved).length : 0;
                return count > 0 ? (
                    <span className="ml-auto bg-momon-red text-white text-xs px-2 py-0.5 rounded-full">{count}</span>
                ) : null;
            })()}
        </button>
      </div>

      {/* HELP / TUTORIAL MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md border-4 border-momon-black rounded-2xl shadow-[10px_10px_0px_0px_rgba(35,31,32,1)] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-momon-yellow p-3 border-b-4 border-momon-black flex justify-between items-center">
                    <h3 className="text-xl font-black text-momon-black uppercase italic flex items-center gap-2">
                        <HelpCircle size={24} /> GUÍA DE JUEGO
                    </h3>
                    <button onClick={() => setShowHelp(false)} className="bg-white p-1 rounded border-2 border-momon-black hover:bg-red-100">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto space-y-4 bg-gray-50">
                    
                    {/* Section 1: Power Ups */}
                    <div className="bg-white border-2 border-momon-black rounded-xl p-3">
                        <h4 className="font-black text-purple-600 uppercase mb-2 border-b-2 border-gray-100 pb-1">PODERES ESPECIALES</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500 rounded-full border-2 border-black flex items-center justify-center text-white shadow-sm">
                                    <Zap size={20} fill="currentColor"/>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">IMÁN</p>
                                    <p className="text-xs text-gray-500">Atrae todas las perlas hacia ti.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center text-white shadow-sm">
                                    <Shield size={20} fill="currentColor"/>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">ESCUDO</p>
                                    <p className="text-xs text-gray-500">Te protege de un golpe de Erizo.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Items */}
                    <div className="bg-white border-2 border-momon-black rounded-xl p-3">
                        <h4 className="font-black text-momon-green uppercase mb-2 border-b-2 border-gray-100 pb-1">LO BUENO</h4>
                        <div className="flex justify-around text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-black rounded-full border border-gray-600 mb-1"></div>
                                <span className="text-[10px] font-bold">Puntos</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full border border-yellow-600 mb-1 shadow-[0_0_10px_gold]"></div>
                                <span className="text-[10px] font-bold">Bonus</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-red-500 rounded-full border border-red-700 mb-1 flex items-center justify-center text-[8px] text-white">🍓</div>
                                <span className="text-[10px] font-bold">Fiebre</span>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-2">¡Llena la barra de colores para activar MODO FIEBRE!</p>
                    </div>

                    {/* Section 3: Hazards */}
                    <div className="bg-white border-2 border-momon-black rounded-xl p-3">
                        <h4 className="font-black text-red-600 uppercase mb-2 border-b-2 border-gray-100 pb-1">PELIGROS</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-200 rounded border-2 border-cyan-600 flex items-center justify-center relative">
                                    <Snowflake size={20} className="text-cyan-600"/>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-cyan-600">HIELO (Brain Freeze)</p>
                                    <p className="text-xs text-gray-500">Te congela 2 segundos. ¡No podrás moverte!</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs">⚠️</div>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-red-600">ERIZO</p>
                                    <p className="text-xs text-gray-500">-1 Vida y <span className="font-black">-500 Puntos</span>.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="p-3 bg-gray-100 border-t-2 border-momon-black text-center">
                    <button onClick={() => setShowHelp(false)} className="bg-momon-black text-white px-6 py-2 rounded-lg font-black text-sm uppercase hover:bg-gray-800 w-full">
                        ¡ENTENDIDO!
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Rewards Tiers Modal */}
      {showRewards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm border-4 border-momon-black rounded-2xl shadow-[10px_10px_0px_0px_rgba(35,31,32,1)] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-momon-yellow p-4 border-b-4 border-momon-black flex justify-between items-center">
                    <h3 className="text-2xl font-black text-momon-black uppercase italic">Niveles</h3>
                    <button onClick={() => setShowRewards(false)} className="bg-white p-1 rounded border-2 border-momon-black hover:bg-red-100">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    {Object.values(REWARD_TIERS)
                        .filter(tier => tier.minScore > 0) // HIDE THE NOVICE TIER FROM THE TABLE
                        .map((tier) => (
                        <div key={tier.name} className="flex items-center justify-between p-3 border-2 border-momon-black rounded-xl" style={{ backgroundColor: `${tier.color}20` }}>
                            <div className="flex flex-col text-left">
                                <span className="font-black text-lg uppercase" style={{ color: tier.color === '#ffffff' ? '#000' : tier.color }}>{tier.name}</span>
                                <span className="text-xs font-bold text-gray-500">{tier.minScore.toLocaleString()}+ Pts</span>
                            </div>
                            <div className="bg-momon-black text-white px-3 py-1 rounded-lg font-black transform -rotate-2 text-lg">
                                {tier.discount}
                            </div>
                        </div>
                    ))}
                    
                    <div className="mt-4 bg-gray-100 p-3 rounded-lg text-left text-xs text-gray-600 border-l-4 border-momon-red">
                        <p className="font-bold mb-1">⚠️ REGLAS:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Diamante:</strong> ¡Es muy difícil!</li>
                            <li><strong>Erizos:</strong> Restan puntos.</li>
                            <li>Los premios NO son acumulables.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md h-[80vh] flex flex-col border-4 border-momon-black rounded-2xl shadow-[10px_10px_0px_0px_rgba(35,31,32,1)] overflow-hidden animate-in slide-in-from-bottom duration-300">
                  <div className="bg-momon-black p-4 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                          <Wallet className="text-momon-yellow" />
                          <h3 className="text-2xl font-black text-momon-yellow uppercase italic">Mis Premios</h3>
                      </div>
                      <button onClick={() => setShowWallet(false)} className="bg-white p-1 rounded border-2 border-black hover:bg-red-100">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                      {coupons.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                              <Gift size={64} className="mb-4"/>
                              <p className="font-bold text-xl">¡No tienes premios!</p>
                              <p className="text-sm">Juega para ganar descuentos.</p>
                          </div>
                      ) : (
                          coupons.map(coupon => {
                              const timeLeft = getTimeLeft(coupon.expiresAt);
                              const isExpired = timeLeft === "CADUCADO";
                              
                              return (
                                  <div key={coupon.id} className={`relative border-4 border-momon-black rounded-xl overflow-hidden bg-white shadow-sm transition-opacity ${isExpired ? 'opacity-50 grayscale' : ''}`}>
                                      {/* Coupon Header */}
                                      <div className="bg-momon-yellow border-b-4 border-momon-black p-3 flex justify-between items-center">
                                          <span className="font-black uppercase text-sm">{coupon.tier}</span>
                                          <span className={`text-xs font-bold px-2 py-1 rounded bg-white border-2 border-black ${isExpired ? 'text-red-600' : 'text-momon-green'}`}>
                                              {timeLeft}
                                          </span>
                                      </div>
                                      
                                      {/* Body */}
                                      <div className="p-4 flex flex-col gap-2 items-center text-center">
                                          <h4 className="text-2xl font-black text-momon-red">{coupon.value}</h4>
                                          <p className="text-sm font-bold italic">"{coupon.name}"</p>
                                          
                                          {!isExpired ? (
                                              redeemId === coupon.id ? (
                                                  <div className="w-full bg-red-50 border-2 border-red-200 p-3 rounded-lg animate-in fade-in">
                                                      <p className="text-xs font-bold text-red-600 mb-2">¿ESTÁS EN CAJA?</p>
                                                      <p className="text-[10px] text-gray-600 mb-2">Esta acción eliminará el cupón permanentemente.</p>
                                                      <div className="flex gap-2">
                                                          <button 
                                                              onClick={() => setRedeemId(null)}
                                                              className="flex-1 py-2 text-xs font-bold border-2 border-gray-300 rounded hover:bg-gray-100"
                                                          >
                                                              CANCELAR
                                                          </button>
                                                          <button 
                                                              onClick={() => redeemCoupon(coupon.id)}
                                                              className="flex-1 py-2 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700 flex justify-center items-center gap-1"
                                                          >
                                                              <Trash2 size={12}/> SÍ, USAR
                                                          </button>
                                                      </div>
                                                  </div>
                                              ) : (
                                                  <div className="w-full bg-gray-100 p-2 rounded border-2 border-dashed border-gray-300 mt-2">
                                                      <p className="font-mono font-bold text-lg tracking-widest">{coupon.code}</p>
                                                      <button 
                                                          onClick={() => setRedeemId(coupon.id)}
                                                          className="w-full mt-2 bg-momon-black text-white py-2 rounded font-bold text-sm hover:bg-gray-800 flex items-center justify-center gap-2"
                                                      >
                                                          CANJEAR AHORA
                                                      </button>
                                                  </div>
                                              )
                                          ) : (
                                              <div className="w-full bg-gray-200 p-2 rounded text-center font-bold text-gray-500 text-xs uppercase">
                                                  CUPÓN EXPIRADO
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
