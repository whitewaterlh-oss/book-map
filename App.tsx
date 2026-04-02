import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, MapPin, Navigation, Info, ChevronRight, Search } from 'lucide-react';
import { literaryData, LiteraryData } from './data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapRef({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setMap(map);
    }
  }, [map, setMap]);
  return null;
}

export default function App() {
  const [selectedAuthor, setSelectedAuthor] = useState<LiteraryData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([34.3416, 108.9398]); // Center of China
  const [zoom, setZoom] = useState(5);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const filteredData = literaryData.filter(item => 
    item.author.includes(searchTerm) || 
    item.novel.includes(searchTerm) || 
    item.city.includes(searchTerm)
  );

  const handleSelect = (item: LiteraryData) => {
    setSelectedAuthor(item);
    setMapCenter(item.coords);
    setZoom(8);
  };

  // Synchronize sidebar scroll when selectedAuthor changes
  useEffect(() => {
    if (selectedAuthor && sidebarRef.current) {
      const element = document.getElementById(`author-${selectedAuthor.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedAuthor]);

  // Handle map resizing
  useEffect(() => {
    if (!mapAreaRef.current || !mapInstance) return;
    const observer = new ResizeObserver(() => {
      mapInstance.invalidateSize();
    });
    observer.observe(mapAreaRef.current);
    return () => observer.disconnect();
  }, [mapInstance]);

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-50 font-sans text-stone-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-stone-900 p-2 rounded-lg">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-serif">中国近现代文学地图</h1>
            <p className="text-xs text-stone-500 font-medium uppercase tracking-widest">Literary Geography of Modern China</p>
          </div>
        </div>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="搜索作家、作品或城市..." 
            className="pl-10 pr-4 py-2 bg-stone-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-stone-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Map Area */}
        <div ref={mapAreaRef} className="h-[40vh] md:h-full md:flex-1 relative z-0 border-b md:border-b-0 md:border-r border-stone-200">
          <MapContainer 
            center={mapCenter} 
            zoom={zoom} 
            scrollWheelZoom={true}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} zoom={zoom} />
            <MapResizeHandler />
            <MapRef setMap={setMapInstance} />
            
            {literaryData.map((item) => (
              <Marker 
                key={item.id} 
                position={item.coords} 
                icon={customIcon}
                eventHandlers={{
                  click: () => handleSelect(item),
                }}
              >
                <Popup className="custom-popup" maxWidth={240} minWidth={200} closeButton={false}>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center shrink-0">
                        <BookOpen className="w-3 h-3 text-white" />
                      </div>
                      <h4 className="font-serif font-bold text-stone-900 leading-tight text-sm">{item.author}</h4>
                    </div>
                    <p className="text-[11px] text-stone-600 italic mb-2 font-serif opacity-80">{item.novel}</p>
                    <div className="h-px bg-stone-100 w-full mb-3" />
                    <p className="text-[10px] md:text-[11px] text-stone-500 line-clamp-5 leading-relaxed mb-4">
                      {item.story}
                    </p>
                    <button 
                      onClick={() => handleSelect(item)}
                      className="w-full py-2 bg-stone-900 text-white text-[10px] font-bold rounded-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      查看完整详情 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button 
              onClick={() => {
                setMapCenter([34.3416, 108.9398]);
                setZoom(5);
                setSelectedAuthor(null);
              }}
              className="bg-white p-2 md:p-3 rounded-xl shadow-lg hover:bg-stone-50 transition-colors border border-stone-200"
              title="重置视图"
            >
              <Navigation className="w-4 h-4 md:w-5 md:h-5 text-stone-900" />
            </button>
          </div>
        </div>

        {/* Sidebar / Bottom Section */}
        <aside className="flex-1 md:h-full w-full md:w-96 bg-white flex flex-col z-10 shadow-xl overflow-hidden relative">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-stone-500 flex items-center gap-2">
              <Info className="w-4 h-4" /> 文学地标列表 ({filteredData.length})
            </h2>
            <div className="md:hidden">
              <Search className="w-4 h-4 text-stone-400" />
            </div>
          </div>
          
          <div className="p-3 md:hidden bg-white border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3 h-3" />
              <input 
                type="text" 
                placeholder="搜索作家、作品..." 
                className="w-full pl-8 pr-4 py-1.5 bg-stone-100 border-none rounded-lg text-xs focus:ring-1 focus:ring-stone-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div ref={sidebarRef} className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredData.map((item) => (
              <motion.button
                key={item.id}
                id={`author-${item.id}`}
                whileHover={{ backgroundColor: '#f5f5f4' }}
                onClick={() => handleSelect(item)}
                className={cn(
                  "w-full text-left p-5 border-b border-stone-100 transition-all flex items-start gap-4 group",
                  selectedAuthor?.id === item.id ? "bg-stone-100 border-l-4 border-l-stone-900" : "border-l-4 border-l-transparent"
                )}
              >
                  <div className="w-12 h-16 bg-stone-100 rounded shadow-sm overflow-hidden flex-shrink-0 border border-stone-200 group-hover:border-stone-400 transition-colors flex items-center justify-center">
                    <img 
                      src={item.cover} 
                      alt={item.novel} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + item.id + '/100/150';
                      }}
                    />
                  </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-stone-900">{item.author}</h3>
                    <span className="text-[10px] bg-stone-200 px-2 py-0.5 rounded-full text-stone-600 font-bold">ID: {item.id}</span>
                  </div>
                  <p className="text-sm text-stone-600 font-serif italic mt-0.5">{item.novel}</p>
                  <p className="text-[10px] md:text-[11px] text-stone-500 mt-1 md:mt-2 line-clamp-2 leading-relaxed">
                    {item.story}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-stone-400 mt-2">
                    <MapPin className="w-3 h-3" />
                    {item.city}
                  </div>
                </div>
                <ChevronRight className={cn("w-5 h-5 text-stone-300 transition-transform", selectedAuthor?.id === item.id && "rotate-90 text-stone-900")} />
              </motion.button>
            ))}
          </div>

          {/* Floating Details Card - Now integrated into the bottom section on mobile */}
          <AnimatePresence>
            {selectedAuthor && (
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 bg-white z-50 flex flex-col overflow-hidden md:fixed md:inset-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[90%] md:max-w-2xl md:rounded-2xl md:shadow-2xl md:border md:border-stone-200 md:max-h-[85vh] md:overflow-visible"
              >
                <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-visible custom-scrollbar">
                  <div className="md:w-1/3 bg-stone-900 p-6 md:p-6 text-white flex flex-col justify-center items-center text-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-20 blur-2xl scale-150">
                      <img src={selectedAuthor.cover} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="w-28 h-40 md:w-32 md:h-48 bg-white/10 rounded-lg shadow-2xl overflow-hidden mb-4 relative z-10 border border-white/20 flex items-center justify-center">
                      <img 
                        src={selectedAuthor.cover} 
                        alt={selectedAuthor.novel} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + selectedAuthor.id + '/200/300';
                        }}
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold mb-1 relative z-10">{selectedAuthor.author}</h3>
                    <p className="text-stone-400 text-xs md:text-sm italic relative z-10">{selectedAuthor.novel}</p>
                    
                    {/* Mobile Close Button (Top Right) */}
                    <button 
                      onClick={() => setSelectedAuthor(null)}
                      className="md:hidden absolute top-4 right-4 z-20 bg-black/20 p-2 rounded-full backdrop-blur-md"
                    >
                      <ChevronRight className="w-5 h-5 text-white rotate-90" />
                    </button>
                  </div>
                  
                  <div className="md:w-2/3 p-6 md:p-8 pb-10 md:pb-8 flex flex-col">
                    <div className="flex items-center gap-2 text-stone-500 mb-4 text-sm font-medium">
                      <Navigation className="w-4 h-4 text-stone-900" />
                      <span>{selectedAuthor.city}</span>
                      <span className="mx-2 text-stone-300">|</span>
                      <span className="text-stone-400">{selectedAuthor.specificLoc}</span>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <section>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">作品背景</h4>
                        <p className="text-stone-700 leading-relaxed text-sm">
                          {selectedAuthor.story}
                        </p>
                      </section>
                      
                      <section className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> 旅行推荐
                        </h4>
                        <p className="text-stone-600 text-sm leading-relaxed italic">
                          {selectedAuthor.travel}
                        </p>
                      </section>
                    </div>

                    <button 
                      onClick={() => setSelectedAuthor(null)}
                      className="mt-8 text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                      返回列表
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e7e5e4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d6d3d1;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}
