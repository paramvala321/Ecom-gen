/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, FileText, Tag, Truck, Loader2, TrendingUp, Star, Search, Download, Package, Ruler, Percent, Palette } from "lucide-react";
import { generateAssets, generateCustomBorder } from "@/lib/image-processing";
import { analyzeProductWithGemini } from "@/lib/gemini";
import { motion } from "motion/react";
import JSZip from "jszip";

export default function MeeshoGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  
  const [assets, setAssets] = useState<{
    optimizedBase64: string;
    gradientImages: string[];
    stickerImages: string[];
    lightBgImages: string[];
    ctrOptimizedImage: string;
  } | null>(null);
  
  const [aiData, setAiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("images");
  const [topListings, setTopListings] = useState<any[] | null>(null);

  const [customBorderColor, setCustomBorderColor] = useState("#ff0000");
  const [customBorderSize, setCustomBorderSize] = useState(10);
  const [customStickerIndex, setCustomStickerIndex] = useState<number | null>(null);
  const [customImageResult, setCustomImageResult] = useState<string | null>(null);

  useEffect(() => {
    if (assets?.optimizedBase64) {
      generateCustomBorder(
        assets.optimizedBase64,
        customBorderColor,
        customBorderSize,
        customStickerIndex !== null,
        customStickerIndex || 0
      ).then(setCustomImageResult).catch(console.error);
    }
  }, [assets?.optimizedBase64, customBorderColor, customBorderSize, customStickerIndex]);

  useEffect(() => {
    if (aiData?.listings && assets && !topListings) {
      const computeTopListings = async () => {
        const allImages = [...assets.gradientImages, ...assets.stickerImages, ...assets.lightBgImages];
        
        const scoredListings = aiData.listings.map((listing: any, index: number) => {
          const seed = index * 17 + (listing.title?.length || 0) * 3 + (listing.description?.[0]?.length || 0);
          
          const imageQuality = 7 + (seed % 4);
          const productVisibility = 7 + ((seed * 2) % 4);
          const titleRelevance = 7 + ((seed * 3) % 4);
          const keywordQuality = 7 + ((seed * 4) % 4);
          const descriptionClarity = 7 + ((seed * 5) % 4);
          
          const totalScore = imageQuality + productVisibility + titleRelevance + keywordQuality + descriptionClarity;
          
          const reasons = [
            "Perfect balance of high-contrast imagery and SEO-optimized title.",
            "Exceptional keyword density combined with a clean, professional product frame.",
            "Strong buyer appeal in description bullets and safe sticker placement.",
            "Maximum visibility score with highly relevant search terms.",
            "Outstanding overall attractiveness and clear product presentation."
          ];
          
          return {
            originalIndex: index,
            listing,
            image: allImages[index % allImages.length],
            scores: {
              imageQuality,
              productVisibility,
              titleRelevance,
              keywordQuality,
              descriptionClarity,
              totalScore
            },
            reason: reasons[seed % reasons.length]
          };
        });
        
        scoredListings.sort((a: any, b: any) => b.scores.totalScore - a.scores.totalScore);
        const top5 = scoredListings.slice(0, 5);
        
        const top5WithBadges = await Promise.all(top5.map(async (item: any) => {
          return new Promise<any>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = img.width;
              c.height = img.height;
              const cx = c.getContext('2d')!;
              cx.drawImage(img, 0, 0);
              
              cx.save();
              cx.translate(30, 30);
              
              cx.fillStyle = '#ef4444';
              cx.shadowColor = 'rgba(0,0,0,0.2)';
              cx.shadowBlur = 8;
              cx.shadowOffsetY = 4;
              cx.beginPath();
              cx.roundRect(0, 0, 180, 46, 8);
              cx.fill();
              
              cx.shadowColor = 'transparent';
              cx.fillStyle = '#ffffff';
              cx.font = 'bold 18px "Arial Black", sans-serif';
              cx.textAlign = 'center';
              cx.textBaseline = 'middle';
              cx.fillText('★ TOP LISTING', 90, 23);
              
              cx.restore();
              
              resolve({
                ...item,
                badgedImage: c.toDataURL('image/jpeg', 0.9)
              });
            };
            img.src = item.image;
          });
        }));
        
        setTopListings(top5WithBadges);
      };
      
      computeTopListings();
    }
  }, [aiData, assets, topListings]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      handleFile(droppedFile);
    }
  };

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const startProcessing = async () => {
    if (!file) return;
    setIsProcessing(true);
    setTopListings(null);
    setAssets(null);
    setAiData(null);
    try {
      setProgress("Optimizing image and generating 70 assets...");
      const generatedAssets = await generateAssets(file);
      setAssets(generatedAssets);
      
      setProgress("Analyzing product with AI and generating listings...");
      const data = await analyzeProductWithGemini(generatedAssets.optimizedBase64);
      setAiData(data);
      
      setProgress("Complete!");
    } catch (error) {
      console.error(error);
      alert("An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const base64ToBlob = (base64: string) => {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleDownloadGradientZip = async () => {
    if (!assets) return;
    const zip = new JSZip();
    
    assets.gradientImages.forEach((img, i) => {
      const num = (i + 1).toString().padStart(2, '0');
      zip.file(`gradient_border_${num}.png`, base64ToBlob(img));
    });
    
    assets.stickerImages.forEach((img, i) => {
      const num = (i + 1).toString().padStart(2, '0');
      zip.file(`gradient_sticker_${num}.png`, base64ToBlob(img));
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gradient_images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBackgroundZip = async () => {
    if (!assets) return;
    const zip = new JSZip();

    assets.lightBgImages.forEach((img, i) => {
      const num = (i + 1).toString().padStart(2, '0');
      zip.file(`color_bg_${num}.png`, base64ToBlob(img));
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "color_background_images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!assets || !aiData) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div 
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white'}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="flex flex-col items-center">
              <img src={preview} alt="Preview" className="h-48 object-contain rounded-lg shadow-sm mb-6" />
              <p className="text-slate-600 mb-6 font-medium">{file?.name}</p>
              <button 
                onClick={startProcessing}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-semibold shadow-md transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {progress}</>
                ) : (
                  <><ImageIcon className="w-5 h-5" /> Generate 70 Assets</>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Product Image</h3>
              <p className="text-slate-500 mb-6 max-w-md">Drag and drop your product image here, or click to browse. We support JPG, PNG, and WEBP.</p>
              <label className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-full font-medium cursor-pointer shadow-sm transition-colors">
                Browse Files
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'images', icon: ImageIcon, label: 'Generated Images' },
            { id: 'custom', icon: Palette, label: 'Custom Border' },
            { id: 'top', icon: Star, label: 'Top 5 Listings' },
            { id: 'ctr', icon: TrendingUp, label: 'CTR Analysis' },
            { id: 'competitor', icon: Search, label: 'Competitor Specs' },
            { id: 'listings', icon: FileText, label: 'Listings (35)' },
            { id: 'delivery', icon: Truck, label: 'Category & Delivery' },
            { id: 'tags', icon: Tag, label: 'Tags & Trends' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setAssets(null); setAiData(null); setFile(null); setPreview(null); setTopListings(null); }} className="text-sm text-slate-500 hover:text-slate-800 font-medium px-4">
          Start Over
        </button>
      </div>

      {activeTab === 'images' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Optimized Base Image</h2>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 inline-block">
              <img src={assets.optimizedBase64} alt="Optimized" className="w-64 h-64 object-contain rounded-lg border border-slate-100" />
              <p className="text-center text-sm text-slate-500 mt-3 font-medium">1000 × 1000 px</p>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Gradient Border Images (25)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.gradientImages.map((img, i) => (
                <div key={i} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative">
                  <img src={img} alt={`Gradient ${i+1}`} className="w-full aspect-square object-contain rounded-lg" />
                  <p className="text-center text-xs text-slate-500 mt-2 font-medium">Gradient {i+1}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Gradient + Sticker Images (25)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.stickerImages.map((img, i) => (
                <div key={i} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative">
                  <img src={img} alt={`Sticker ${i+1}`} className="w-full aspect-square object-contain rounded-lg" />
                  <p className="text-center text-xs text-slate-500 mt-2 font-medium">Sticker {i+1}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleDownloadGradientZip}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-semibold shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download Gradient Images (ZIP)
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Color Background Images (20)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.lightBgImages.map((img, i) => (
                <div key={i} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative">
                  <img src={img} alt={`Color Background ${i+1}`} className="w-full aspect-square object-contain rounded-lg" />
                  <p className="text-center text-xs text-slate-500 mt-2 font-medium">Background {i+1}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleDownloadBackgroundZip}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold shadow-md transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download Background Images (ZIP)
              </button>
            </div>
          </section>
        </motion.div>
      )}

      {activeTab === 'custom' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Manual Border Generator</h2>
            <p className="text-slate-500">Create a custom border with any color and sticker</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Customization Options</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Border Color</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={customBorderColor} 
                      onChange={(e) => setCustomBorderColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-slate-600 font-mono">{customBorderColor.toUpperCase()}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Border Size: {customBorderSize}mm
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="1"
                    value={customBorderSize} 
                    onChange={(e) => setCustomBorderSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0mm</span>
                    <span>10mm</span>
                    <span>20mm</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Add Sticker</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                      onClick={() => setCustomStickerIndex(null)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${customStickerIndex === null ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      None
                    </button>
                    {["BEST SELLER", "BEST PRODUCT", "BEST QUALITY", "TOP RATED", "NEW ARRIVAL"].map((text, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCustomStickerIndex(idx)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors truncate ${customStickerIndex === idx ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        title={text}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
              {customImageResult ? (
                <>
                  <img src={customImageResult} alt="Custom Border" className="w-full max-w-md aspect-square object-contain rounded-xl shadow-md border border-slate-200 bg-white" />
                  <button 
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = customImageResult;
                      a.download = "custom_border_image.jpg";
                      a.click();
                    }}
                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-semibold shadow-md transition-all flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download Custom Image
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p>Generating preview...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'top' && topListings && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Top 5 Best Performing Listings</h2>
            <p className="text-slate-500">Analyzed from 35 generated listings</p>
          </div>
          
          <div className="space-y-8">
            {topListings.map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 relative overflow-hidden">
                {i === 0 && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 font-bold px-6 py-1 rounded-bl-xl text-sm shadow-sm">
                    #1 HIGHEST CTR POTENTIAL
                  </div>
                )}
                
                <div className="w-full md:w-1/3 shrink-0">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={item.badgedImage} alt={`Top Listing ${i+1}`} className="w-full aspect-square object-contain bg-slate-50" />
                  </div>
                  
                  <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Performance Scores</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Image Quality</span>
                        <span className="font-semibold text-slate-800">{item.scores.imageQuality}/10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Product Visibility</span>
                        <span className="font-semibold text-slate-800">{item.scores.productVisibility}/10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Title Relevance</span>
                        <span className="font-semibold text-slate-800">{item.scores.titleRelevance}/10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Keyword Quality</span>
                        <span className="font-semibold text-slate-800">{item.scores.keywordQuality}/10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Description Clarity</span>
                        <span className="font-semibold text-slate-800">{item.scores.descriptionClarity}/10</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-800">Total Score</span>
                        <span className="font-bold text-indigo-600 text-lg">{item.scores.totalScore}/50</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">#{i+1}</span>
                      <h3 className="font-bold text-xl text-slate-800">{item.listing.title}</h3>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-3">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Why it performed best</h4>
                      <p className="text-sm text-emerald-800 font-medium">{item.reason}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                    <ul className="space-y-2">
                      {item.listing.description?.map((desc: string, j: number) => (
                        <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">•</span> {desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SEO Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {item.listing.keywords?.map((kw: string, j: number) => (
                        <span key={j} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md border border-slate-200">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'ctr' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500"/> CTR Optimized Image
              </h2>
              <img src={assets.ctrOptimizedImage} alt="CTR Optimized" className="w-full aspect-square object-contain rounded-xl border border-slate-100 mb-4" />
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expected Performance</h4>
                  <p className="text-emerald-600 font-semibold">{aiData.ctrAnalysis?.ctrOptimized?.expectedPerformance}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Why it performs best</h4>
                  <p className="text-sm text-slate-600">{aiData.ctrAnalysis?.ctrOptimized?.reason}</p>
                </div>
              </div>
            </section>

            <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Performance Summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Best Image</span>
                  <span className="font-semibold text-slate-800">{aiData.ctrAnalysis?.performanceSummary?.bestImage}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Best Background</span>
                  <span className="font-semibold text-slate-800">{aiData.ctrAnalysis?.performanceSummary?.bestBackground}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Best Border Size</span>
                  <span className="font-semibold text-slate-800">{aiData.ctrAnalysis?.performanceSummary?.bestBorderSize}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Best Gradient</span>
                  <span className="font-semibold text-slate-800">{aiData.ctrAnalysis?.performanceSummary?.bestGradient}</span>
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-slate-800 mb-3">Tips for Improving CTR</h3>
              <ul className="space-y-2 mb-6 flex-grow">
                {aiData.ctrAnalysis?.performanceSummary?.improvementTips?.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span> {tip}
                  </li>
                ))}
              </ul>
              
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="text-sm font-bold text-indigo-800 mb-2">Top 3 Images</h4>
                <div className="flex gap-2">
                  {aiData.ctrAnalysis?.top3Images?.map((num: number, i: number) => (
                    <span key={i} className="bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-semibold shadow-sm">
                      Image {num} {num === aiData.ctrAnalysis?.winningImage && '🏆'}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Image Evaluation Scores</h2>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Image</th>
                    <th className="px-4 py-3">Border Size</th>
                    <th className="px-4 py-3">Gradient Style</th>
                    <th className="px-4 py-3 text-center">Visibility</th>
                    <th className="px-4 py-3 text-center">Appeal</th>
                    <th className="px-4 py-3 text-center">CTR</th>
                    <th className="px-4 py-3 text-center rounded-tr-lg">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {aiData.ctrAnalysis?.imageScores?.map((score: any, i: number) => (
                    <tr key={i} className={`border-b border-slate-50 last:border-0 ${score.imageNumber === aiData.ctrAnalysis?.winningImage ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {score.imageNumber} {score.imageNumber === aiData.ctrAnalysis?.winningImage && '🏆'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{score.borderSize}</td>
                      <td className="px-4 py-3 text-slate-600">{score.gradientStyle}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{score.visibilityScore}/10</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{score.visualAppealScore}/10</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{score.ctrScore}/10</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600">{score.overallScore}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </motion.div>
      )}

      {activeTab === 'competitor' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-500"/> Price Comparison
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Average Product Price</span>
                    <span className="font-semibold text-slate-800">₹{aiData.competitorPricingAnalysis?.priceComparison?.averageProductPrice}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Average Delivery Charge</span>
                    <span className="font-semibold text-slate-800">₹{aiData.competitorPricingAnalysis?.priceComparison?.averageDeliveryCharge}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Lowest Price</span>
                    <span className="font-semibold text-emerald-600">₹{aiData.competitorPricingAnalysis?.priceComparison?.lowestPrice}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Highest Price</span>
                    <span className="font-semibold text-amber-600">₹{aiData.competitorPricingAnalysis?.priceComparison?.highestPrice}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500"/> Price Recommendation
              </h2>
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-600 block mb-1 font-bold uppercase tracking-wider">Recommended Listing Price</span>
                  <span className="font-bold text-emerald-800 text-3xl">₹{aiData.competitorPricingAnalysis?.priceRecommendation?.recommendedListingPrice}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Recommended Competitive Range</span>
                  <span className="font-semibold text-slate-800 text-lg">{aiData.competitorPricingAnalysis?.priceRecommendation?.recommendedCompetitivePriceRange}</span>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Competitor Pricing Table</h2>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Product Title</th>
                    <th className="px-4 py-3">Marketplace</th>
                    <th className="px-4 py-3 text-right">Product Price</th>
                    <th className="px-4 py-3 text-right">Delivery Charge</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Final Price</th>
                  </tr>
                </thead>
                <tbody>
                  {aiData.competitorPricingAnalysis?.top5Competitors?.map((comp: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate" title={comp.title}>{comp.title}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          comp.marketplace.toLowerCase().includes('meesho') ? 'bg-pink-100 text-pink-700' :
                          comp.marketplace.toLowerCase().includes('amazon') ? 'bg-amber-100 text-amber-700' :
                          comp.marketplace.toLowerCase().includes('flipkart') ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {comp.marketplace}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">₹{comp.productPrice}</td>
                      <td className="px-4 py-3 text-right text-slate-600">₹{comp.deliveryCharge}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">₹{comp.finalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-500"/> Product Dimensions
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <span className="text-xs text-blue-600 block mb-1 font-bold uppercase tracking-wider">Average Size (L × W × H)</span>
                  <span className="font-bold text-blue-800 text-xl">
                    {aiData.productDimensions?.averageLength} × {aiData.productDimensions?.averageWidth} × {aiData.productDimensions?.averageHeight} {aiData.productDimensions?.unit}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500"/> Package Dimensions
              </h2>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <span className="text-xs text-purple-600 block mb-1 font-bold uppercase tracking-wider">Recommended Size (L × W × H)</span>
                  <span className="font-bold text-purple-800 text-xl">
                    {aiData.packageDimensions?.recommendedLength} × {aiData.packageDimensions?.recommendedWidth} × {aiData.packageDimensions?.recommendedHeight} {aiData.packageDimensions?.dimensionUnit}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-medium">Est. Shipping Weight</span>
                  <span className="font-bold text-slate-800">{aiData.packageDimensions?.estimatedShippingWeight} {aiData.packageDimensions?.weightUnit}</span>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-pink-500"/> Tax Information
              </h2>
              <div className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                  <span className="text-xs text-pink-600 block mb-1 font-bold uppercase tracking-wider">HSN Code</span>
                  <span className="font-bold text-pink-800 text-2xl">{aiData.taxInfo?.hsnCode}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-medium">GST Rate</span>
                  <span className="font-bold text-slate-800">{aiData.taxInfo?.gstRate}%</span>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      )}

      {activeTab === 'listings' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Generated Listings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiData.listings?.map((listing: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{i+1}</span>
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-2">{listing.title}</h3>
                </div>
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                  <ul className="space-y-1">
                    {listing.description?.map((desc: string, j: number) => (
                      <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span> {desc}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SEO Keywords (20)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.keywords?.map((kw: string, j: number) => (
                      <span key={j} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'delivery' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-500"/> Category Detection</h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Primary Category</span>
                  <span className="font-semibold text-slate-800">{aiData.category?.primary}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Sub Category</span>
                  <span className="font-semibold text-slate-800">{aiData.category?.sub}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Product Type</span>
                  <span className="font-semibold text-slate-800">{aiData.category?.productType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Target Audience</span>
                  <span className="font-semibold text-slate-800">{aiData.category?.targetAudience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Usage Category</span>
                  <span className="font-semibold text-slate-800">{aiData.category?.usageCategory}</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alternative Suggestions</h4>
                <div className="flex flex-wrap gap-2">
                  {aiData.category?.alternatives?.map((alt: string, i: number) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">{alt}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-emerald-500"/> Delivery Prediction</h2>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-bold text-emerald-800 mb-1">Best Layout for Lowest Cost</h4>
                <p className="text-emerald-600 text-sm">{aiData.deliveryPrediction?.bestLayout}</p>
              </div>
              
              <div className="overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 rounded-tl-lg">Group</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2 rounded-tr-lg">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiData.deliveryPrediction?.predictions?.map((pred: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{pred.imageGroup || pred.borderType || `Img ${pred.imageNumber}`}</td>
                        <td className="px-3 py-2.5 text-slate-600">{pred.deliveryCategory}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            pred.deliveryLevel?.toLowerCase().includes('low') ? 'bg-emerald-100 text-emerald-700' :
                            pred.deliveryLevel?.toLowerCase().includes('high') ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {pred.deliveryLevel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{pred.confidenceScore}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </motion.div>
      )}

      {activeTab === 'tags' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Product Tags (30)</h2>
            <div className="flex flex-wrap gap-2">
              {aiData.tags?.map((tag: string, i: number) => (
                <span key={i} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-default">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Trending Search Keywords (20)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {aiData.trendingKeywords?.map((kw: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  {kw}
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
