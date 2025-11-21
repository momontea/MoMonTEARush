import React, { useEffect, useState } from 'react';
import { generateMoMonSpecial, DrinkRecipe } from '../services/geminiService';
import { Loader2, Share2, Home, Copy, CheckCircle, Save } from 'lucide-react';

interface BaristaAIProps {
  score: number;
  onHome: () => void;
}

export const BaristaAI: React.FC<BaristaAIProps> = ({ score, onHome }) => {
  const [recipe, setRecipe] = useState<DrinkRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedToWallet, setSavedToWallet] = useState(false);

  useEffect(() => {
    const fetchDrink = async () => {
      setLoading(true);
      const result = await generateMoMonSpecial(score);
      setRecipe(result);
      setLoading(false);
      
      // Save to Wallet Automatically
      saveToWallet(result);
    };
    fetchDrink();
  }, [score]); 

  const saveToWallet = (drink: DrinkRecipe) => {
      const savedCoupons = JSON.parse(localStorage.getItem('momon_wallet') || '[]');
      
      const newCoupon = {
          id: Date.now().toString(),
          name: drink.name,
          tier: drink.tierName,
          code: drink.reward.discountCode,
          value: drink.reward.discountValue,
          createdAt: Date.now(),
          expiresAt: Date.now() + (72 * 60 * 60 * 1000) // 72 Hours in milliseconds
      };

      const updatedCoupons = [newCoupon, ...savedCoupons];
      localStorage.setItem('momon_wallet', JSON.stringify(updatedCoupons));
      setSavedToWallet(true);
  };

  const handleShare = () => {
    if (recipe) {
      const text = `¡Logré ${score} puntos en MoMon Tea Rush! (Nivel ${recipe.tierName}) Premio: ${recipe.reward.discountValue}! #MoMonTea`;
      if (navigator.share) {
        navigator.share({ title: 'MoMon Tea Rush', text: text, url: window.location.href }).catch(console.error);
      } else {
        navigator.clipboard.writeText(text);
        alert("¡Copiado al portapapeles!");
      }
    }
  };
  
  const copyCode = () => {
      if (recipe) {
          navigator.clipboard.writeText(recipe.reward.discountCode);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-momon-yellow p-6 text-center z-50">
        <div className="relative mb-8">
            <div className="w-32 h-32 bg-white rounded-full border-8 border-momon-black flex items-center justify-center animate-bounce">
                 <div className="w-20 h-20 bg-momon-green rounded-full flex items-center justify-center">
                     <Loader2 className="w-10 h-10 text-white animate-spin" />
                 </div>
            </div>
        </div>
        <h2 className="text-3xl font-black text-momon-black mb-2 uppercase">Calculando Resultados...</h2>
        <p className="text-momon-red font-bold animate-pulse">Verificando Nivel de Premio...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-momon-yellow p-4 flex flex-col items-center min-h-screen">
      
      <div className="w-full max-w-md mt-2 mb-8 relative">
        
        <div className="relative bg-white rounded-2xl border-4 border-momon-black p-6 flex flex-col items-center text-center shadow-[8px_8px_0px_0px_rgba(35,31,32,1)]">
            
            {/* Score Header */}
            <div className="w-full flex justify-between items-center border-b-4 border-momon-black pb-4 mb-4">
                <div className="text-left">
                    <p className="text-xs font-bold text-gray-400 uppercase">PUNTUACIÓN</p>
                    <p className="text-3xl font-black text-momon-black">{score}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-xs font-bold text-gray-400 uppercase">NIVEL</p>
                    <span className="bg-momon-black text-white px-2 py-1 rounded text-sm font-black uppercase">
                        {recipe?.tierName}
                    </span>
                </div>
            </div>

            {/* The Drink */}
            <h2 className="text-3xl font-black text-momon-red leading-tight mb-2 uppercase transform -rotate-1">
                {recipe?.name}
            </h2>
            <p className="text-lg text-momon-black font-bold italic mb-4 leading-tight">
                "{recipe?.description}"
            </p>

            {/* Reward Coupon */}
            <div className="w-full bg-momon-black p-1 rounded-xl mb-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="bg-momon-yellow border-2 border-dashed border-momon-black rounded-lg p-4 flex flex-col items-center">
                    <p className="text-xs font-black text-momon-black uppercase mb-1">TU PREMIO</p>
                    <h3 className="text-4xl font-black text-momon-red mb-2">{recipe?.reward.discountValue}</h3>
                    
                    <div 
                        onClick={copyCode}
                        className="w-full bg-white border-2 border-momon-black py-2 px-4 rounded flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                    >
                        <span className="font-mono font-bold text-lg text-gray-800 tracking-widest">
                            {recipe?.reward.discountCode}
                        </span>
                        {copied ? <CheckCircle className="text-green-500" size={20}/> : <Copy className="text-gray-400" size={20}/>}
                    </div>
                    <div className="flex items-center justify-center mt-2 gap-1">
                         <CheckCircle size={12} className="text-momon-green" />
                         <p className="text-[10px] font-bold text-momon-black">Guardado en Mis Premios (72h)</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="w-full grid grid-cols-2 gap-4 mb-6 text-left">
                <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase mb-1">INGREDIENTES</h4>
                    <p className="text-sm font-bold text-momon-black leading-tight">
                        {recipe?.ingredients.join(', ')}
                    </p>
                </div>
                <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase mb-1">VIBE CHECK</h4>
                    <p className="text-sm font-bold text-momon-black uppercase">
                        ⚡ {recipe?.vibe}
                    </p>
                </div>
            </div>
            
             <div className="mb-6 w-full bg-gray-100 p-2 rounded border-2 border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold text-center">
                    * Puedes ver y canjear este premio desde el menú principal en "Mis Premios".
                </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                    onClick={handleShare}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl border-4 border-momon-black shadow-[4px_4px_0px_0px_rgba(35,31,32,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <Share2 size={18} /> Compartir
                </button>
                <button 
                    onClick={onHome}
                    className="bg-momon-green hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl border-4 border-momon-black shadow-[4px_4px_0px_0px_rgba(35,31,32,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <Home size={18} /> Menú
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};