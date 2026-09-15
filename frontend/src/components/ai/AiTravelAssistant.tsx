import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Sparkles, Car, Calculator, Compass, Palmtree, CreditCard, MapPin } from 'lucide-react';
import { KENYA_DESTINATIONS } from '@/data/kenyaDestinations';
import type { Destination } from '@/data/kenyaDestinations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostEstimate {
  destinationName: string;
  days: number;
  passengers: number;
  vehicleType: string;
  dailyRateKes: number;
  vehicleTotalKes: number;
  estimatedFuelKes: number;
  parkFeesKes: number;
  driverAllowanceKes: number;
  totalKes: number;
  totalUsd: number;
}

interface SuggestedAction {
  label: string;
  url: string;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  destinationData?: Destination;
  costEstimate?: CostEstimate;
  suggestedAction?: SuggestedAction;
}

// ─── Knowledge Base ────────────────────────────────────────────────────────────

const GENERAL_KNOWLEDGE: Record<string, string> = {
  greeting: "Jambo! I'm your M-TRAVEL AI Concierge — your expert guide to travel, safari planning, vehicle hire, and tour bookings across Kenya and East Africa. Ask me anything about destinations, costs, vehicles, best travel times, or how to plan your perfect trip!",

  mtravel: "**M-TRAVEL** is Kenya's premier independent travel marketplace. We connect travelers with quality vehicles (cars, SUVs, vans, 4x4s), curated safari tours, holiday homes, and bus routes — all with M-Pesa payment built in. We are fully independent, so we partner with top local operators to give you unbiased, handpicked experiences.",

  mpesa: "We accept **M-Pesa, Visa/Mastercard, and wallet payments**. For M-Pesa bookings, you'll receive an STK push to confirm payment instantly. All transactions are secured and you get a booking QR code immediately after confirmation.",

  visaKenya: "Most nationalities get a **Kenya e-Visa** online at evisa.go.ke. Cost is $51 USD for a single-entry 90-day visa. East African citizens enjoy free entry. Citizens of many African countries also get visa-on-arrival. Always check the latest requirements before travel.",

  bestTimeAfrica: "**Best time for East Africa safaris**: July–October (peak wildebeest migration, dry season, best wildlife viewing). January–February is also excellent (short dry season, fewer crowds). March–June is the long rains — discounts available but some parks muddy.",

  budget: "**Budget travel in Kenya**: Budget travelers can explore on KES 3,000–5,000/day. Mid-range is KES 8,000–15,000/day. Luxury safaris run KES 25,000–100,000+/day including accommodation, vehicle, and park fees.",

  maasaiMara: "**Maasai Mara** is Kenya's crown jewel — home to the Big Five and the world-famous Great Wildebeest Migration (July–October). Entry conservancy fees range KES 3,000–13,000 depending on conservancy. A 3-night package typically costs KES 45,000–150,000 per person. We recommend a 4x4 Land Cruiser or Toyota Prado.",

  amboseli: "**Amboseli National Park** is world-famous for its large-tusked elephants set against Mount Kilimanjaro's backdrop. Park entry: ~KES 860 (residents) / $60 (non-residents) per day. Best visited June–October and January–February. A 2-day trip from Nairobi (240km) costs approximately KES 35,000–60,000 all-inclusive.",

  diani: "**Diani Beach** on Kenya's South Coast is consistently voted Africa's best beach. 500km from Nairobi via Mombasa. Pristine white sands, crystal waters, kite surfing, scuba diving, and nearby Shimba Hills. Best October–March. A family van or luxury sedan is ideal for the tarmac journey.",

  naivasha: "**Lake Naivasha** is just 95km from Nairobi (1.5 hours). It's famous for boat rides among hippos, cycling in Hell's Gate National Park among zebras and giraffes, Crescent Island walks, and geothermal spas at Olkaria. Perfect weekend escape. Entry KES 600. An easy sedan or SUV drive.",

  mountKenya: "**Mount Kenya National Park** sits 180km from Nairobi. Point Lenana (4,985m) is the trekker's summit — accessible without technical climbing. Trek duration: 3–5 days. The park also has game drives with buffaloes, elephants, and bushbucks. A 4WD is essential for forest tracks.",

  tsavo: "**Tsavo West & East** form Kenya's largest national park system (22,000 sq km). Famous for red-dust elephants, Mzima Springs crystal pools, Shetani lava flows, and Aruba Dam. 330km from Nairobi. Entry ~KES 860. 4x4 required. A 3-day self-drive costs KES 40,000–80,000.",

  vehicles: "**M-TRAVEL Fleet Standards**:\n• **4x4 Safari SUV (Prado/Land Cruiser)** — KES 12,000–18,000/day. Best for national parks, rough terrain, river crossings.\n• **Safari Van (Minibus)** — KES 8,000–12,000/day. Up to 7 passengers, pop-up roof, great for group safaris.\n• **Executive Sedan (Corolla/Premio)** — KES 5,000–7,000/day. Coastal trips, city drives, highway journeys.\n• **Pickup Truck** — KES 9,000–14,000/day. Heavy loads, rural roads, camping gear.",

  packingList: "**Kenya Safari Packing Checklist**:\n• Sunscreen SPF 50+\n• Insect repellent (DEET)\n• Neutral earth-tone clothing (khaki, beige, olive)\n• Comfortable walking shoes / boots\n• Camera with optical zoom lens\n• Torch / headlamp\n• Anti-malaria medication (consult physician)\n• Hand sanitizer\n• Offline GPS maps\n• Reusable thermal water bottle",

  malaria: "**Malaria in Kenya**: Risk is present in most of Kenya below 2,500m including coastal areas and most game parks. Start prophylaxis (Malarone, Doxycycline, or Mefloquine) before travel — consult your doctor. Use insect repellent, sleep under nets, wear long sleeves at dusk.",

  zanzibar: "**Zanzibar, Tanzania** — a stunning Indian Ocean island 1.5 hours by ferry from Dar es Salaam. Famous for Stone Town (UNESCO heritage), spice tours, pristine Nungwi and Kendwa beaches. Entry: Zanzibar tourist levy $30. Best November–March. Combine with a Serengeti safari for the ultimate East Africa experience.",

  serengeti: "**Serengeti National Park (Tanzania)** — neighbor to Kenya's Maasai Mara, sharing the same ecosystem. Over 1 million wildebeest migrate in a circular route. Entry $60/day. A 5-day Serengeti + Ngorongoro Crater circuit costs $800–2,500 USD per person depending on lodge tier.",

  mombasa: "**Mombasa, Kenya's coastal city** — gateway to the South Coast beaches. Fort Jesus (UNESCO site), Old Town spice markets, and Haller Park. 480km from Nairobi (SGR train: 4.5 hours, KES 1,000). Fort Jesus entry KES 1,500. Use M-TRAVEL to hire a vehicle for coastal exploration.",

  food: "**Kenyan cuisine highlights**: Nyama Choma (grilled meat), Ugali (maize cake), Sukuma Wiki (sautéed greens), Pilau rice, Mandazi (fried dough), Chai (spiced tea). Coast specialties: Swahili biryani, coconut fish, samosas. Budget meal: KES 200–500. Mid-range restaurant: KES 800–2,000.",

  currency: "**Kenya currency**: Kenyan Shilling (KES). Current rate: ~KES 130 per USD, ~KES 160 per EUR, ~KES 165 per GBP. Banks and Forex bureaus in Nairobi city center and airports. M-Pesa works everywhere. ATMs widely available.",

  safety: "**Kenya travel safety**: Nairobi, Mombasa, and tourist parks are generally safe for visitors. Exercise normal urban precautions — avoid displaying expensive gadgets, use registered taxis/Uber, keep documents secure. Foreign Office travel advisories recommend caution near Somalia and Ethiopian borders — M-TRAVEL only operates in safe tourist zones.",

  connectivity: "**Internet & SIM in Kenya**: Safaricom (best coverage), Airtel, and Telkom. A tourist SIM with 20GB data costs KES 1,000–2,000. 4G coverage is excellent in Nairobi, Mombasa, and most towns. National parks have limited or no signal — download offline maps before your trip.",
};

// ─── AI Response Engine ────────────────────────────────────────────────────────

function buildAiResponse(query: string): {
  text: string;
  dest?: Destination;
  cost?: CostEstimate;
  action?: SuggestedAction;
} {
  const q = query.toLowerCase();

  // Greeting detection
  if (/\b(hi|hello|hey|jambo|habari|hujambo|good morning|good evening|sup|what's up)\b/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.greeting };
  }

  // M-TRAVEL info
  if (/m.?travel|about us|who are you|your company|your platform/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.mtravel };
  }

  // Payment
  if (/mpesa|m-pesa|payment|pay|card|visa|mastercard|wallet/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.mpesa };
  }

  // Visa / Entry
  if (/visa|entry|passport|permit|immigration/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.visaKenya };
  }

  // Best time
  if (/best time|when to visit|season|weather|rain|dry season|migration/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.bestTimeAfrica };
  }

  // Budget
  if (/budget|cost|cheap|expensive|price|afford|how much (for|to) travel/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.budget };
  }

  // Vehicles
  if (/vehicle|car|suv|van|prado|land cruiser|4x4|pickup|fleet|hire a car|rent/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.vehicles };
  }

  // Packing
  if (/pack|what to bring|luggage|clothes|kit|gear/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.packingList };
  }

  // Health / Malaria
  if (/malaria|health|vaccine|vaccination|medicine|mosquito|medical/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.malaria };
  }

  // Food
  if (/food|eat|restaurant|cuisine|nyama|ugali|swahili|local dish/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.food };
  }

  // Currency
  if (/currency|money|exchange|shilling|kes|usd|forex/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.currency };
  }

  // Safety
  if (/safe|security|danger|crime|risk|is kenya safe/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.safety };
  }

  // Internet / SIM
  if (/sim|internet|wifi|data|network|safaricom|connectivity/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.connectivity };
  }

  // Zanzibar
  if (/zanzibar|stone town|tanzania coast/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.zanzibar };
  }

  // Serengeti
  if (/serengeti|ngorongoro|tanzania|dar es salaam/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.serengeti };
  }

  // Mombasa
  if (/mombasa|fort jesus|old town coast/.test(q)) {
    return { text: GENERAL_KNOWLEDGE.mombasa };
  }

  // ── Destination matching with cost calculation ──

  let matchedDest: Destination | undefined;

  if (/mara|migration|wildebeest|masai|maasai/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'maasai-mara');
  } else if (/amboseli|kilimanjaro|elephant/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'amboseli');
  } else if (/diani|beach|coast|ocean|swim|snorkel/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'diani-beach');
  } else if (/naivasha|hell.?gate|hippo|boat|rift/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'lake-naivasha');
  } else if (/mount kenya|mountain|trek|hiking|point lenana/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'mount-kenya');
  } else if (/tsavo|mzima|lava|aruba/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'tsavo-national-parks');
  } else if (/safari|national park|game drive|big five/.test(q)) {
    matchedDest = KENYA_DESTINATIONS.find((d) => d.id === 'maasai-mara');
  }

  if (matchedDest) {
    // Extract days/passengers from query
    const daysMatch = q.match(/(\d+)\s*day/);
    const paxMatch = q.match(/(\d+)\s*(person|people|passenger|pax)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 3;
    const passengers = paxMatch ? parseInt(paxMatch[1]) : 4;
    const vehicleType = matchedDest.suggestedVehicleTypes[0] || 'SUV';

    const dailyRate = vehicleType === 'SUV' ? 12000 : vehicleType === 'VAN' ? 10000 : 7000;
    const vehicleTotal = dailyRate * days;
    const fuelEst = Math.round(matchedDest.distanceFromNairobiKm * 2 * 25 + days * 1500);
    const parkFees = matchedDest.kwsAdultFeeKes * passengers * days;
    const driverAllowance = days * 2000;
    const totalKes = vehicleTotal + fuelEst + parkFees + driverAllowance;

    const text = `Great choice! Here's everything you need to know about **${matchedDest.name}**:\n\n• **Location**: ${matchedDest.location}\n• **Highlights**: ${matchedDest.highlights.slice(0, 3).join(', ')}\n• **Best Time to Visit**: ${matchedDest.bestMonths}\n• **Recommended Vehicle**: ${matchedDest.vehicleReason}\n\nI've calculated your estimated trip cost below for ${days} days, ${passengers} passengers.`;

    return {
      text,
      dest: matchedDest,
      cost: {
        destinationName: matchedDest.name,
        days,
        passengers,
        vehicleType,
        dailyRateKes: dailyRate,
        vehicleTotalKes: vehicleTotal,
        estimatedFuelKes: fuelEst,
        parkFeesKes: parkFees,
        driverAllowanceKes: driverAllowance,
        totalKes,
        totalUsd: Math.round(totalKes / 130),
      },
      action: {
        label: `Book a ${vehicleType} for ${matchedDest.name}`,
        url: `/search?type=${vehicleType}`,
      },
    };
  }

  // General travel questions fallback
  if (/plan|itinerary|suggest|recommend|where|trip|travel|destination/.test(q)) {
    return {
      text: `I'd love to help you plan the perfect trip! Here are some popular M-TRAVEL experiences:\n\n• **Maasai Mara Safari** — 3 days, KES 50,000–90,000/group\n• **Amboseli Elephant Safari** — 2 days, KES 35,000–60,000/group\n• **Diani Beach Escape** — 3 days, KES 30,000–70,000/group\n• **Mount Kenya Trek** — 4 days, KES 45,000–80,000/group\n• **Lake Naivasha Weekend** — 1–2 days, KES 15,000–35,000/group\n\nTell me which destination excites you most and I'll give you a full itinerary with exact costs, vehicle recommendations, and booking options!`,
    };
  }

  // Default helpful response
  return {
    text: `Great question! I'm here to help with anything travel-related — destinations, costs, vehicle hire, safaris, beaches, mountains, city tours, packing advice, visa info, local food, safety tips, and more.\n\nHere are some things you can ask me:\n• "Plan a 3-day Maasai Mara safari for 4 people"\n• "What vehicle do I need for Amboseli?"\n• "How much does a trip to Diani Beach cost?"\n• "Is Kenya safe to travel?"\n• "What should I pack for a safari?"\n• "How do I pay with M-Pesa?"\n\nWhat would you like to know?`,
  };
}

// ─── Preset Prompts ────────────────────────────────────────────────────────────

const PRESET_PROMPTS = [
  { text: 'Plan a Maasai Mara safari for 4 people', icon: Compass },
  { text: 'What 4x4 vehicle do I need for Amboseli?', icon: Car },
  { text: 'How much is a luxury Diani Beach trip?', icon: Palmtree },
  { text: 'How does direct M-Pesa payment work?', icon: CreditCard },
  { text: 'What are Kenya’s premier safari destinations?', icon: MapPin },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function AiTravelAssistant({
  isModal = false,
  onClose,
}: {
  isModal?: boolean;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: GENERAL_KNOWLEDGE.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState('maasai-mara');
  const [calcDays, setCalcDays] = useState(3);
  const [calcPassengers, setCalcPassengers] = useState(4);
  const [calcVehicleType, setCalcVehicleType] = useState('SUV');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  const currentDestination =
    KENYA_DESTINATIONS.find((d) => d.id === selectedDestId) || KENYA_DESTINATIONS[0];

  const handleSend = useCallback(
    (userText?: string) => {
      const text = userText || input;
      if (!text.trim()) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!userText) setInput('');
      setIsTyping(true);

      setTimeout(() => {
        const { text: aiText, dest, cost, action } = buildAiResponse(text);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          destinationData: dest,
          costEstimate: cost,
          suggestedAction: action,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 900);
    },
    [input]
  );

  const calculatedResult = React.useMemo(() => {
    const dest = currentDestination;
    const dailyRate = calcVehicleType === 'SUV' ? 12000 : calcVehicleType === 'VAN' ? 10000 : 7000;
    const vehicleTotal = dailyRate * calcDays;
    const fuelEst = Math.round(dest.distanceFromNairobiKm * 2 * 25 + calcDays * 1500);
    const parkFees = dest.kwsAdultFeeKes * calcPassengers * calcDays;
    const driverAllowance = calcDays * 2000;
    const totalKes = vehicleTotal + fuelEst + parkFees + driverAllowance;
    return {
      dailyRate,
      vehicleTotal,
      fuelEst,
      parkFees,
      driverAllowance,
      totalKes,
      totalUsd: Math.round(totalKes / 130),
    };
  }, [currentDestination, calcDays, calcPassengers, calcVehicleType]);

  return (
    <div
      className={`glass-card-3d overflow-hidden flex flex-col ${
        isModal ? 'h-[85vh] max-w-4xl w-full mx-auto' : 'h-[750px] w-full'
      }`}
    >
      {/* HEADER */}
      <div className="bg-slate-50/90 p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-marigold via-coral to-teal shadow-glow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
              M-TRAVEL AI Travel Concierge
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase font-mono font-bold text-emerald-600 border border-emerald-500/30">
                Online
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Ask me anything — destinations, costs, vehicles, visas, packing, safety & more
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="btn-ghost !px-3 !py-1.5 text-xs">
            Close
          </button>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        {/* CHAT PANEL */}
        <div className="lg:col-span-7 flex flex-col border-r border-slate-200 bg-slate-50/40 overflow-hidden">
          {/* MESSAGES */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl p-4 ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none space-y-3 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* DESTINATION CARD */}
                  {msg.destinationData && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden space-y-3 p-3 shadow-sm">
                      <div className="relative h-40 rounded-lg overflow-hidden">
                        <img
                          src={msg.destinationData.imageUrl}
                          alt={msg.destinationData.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm">
                          {msg.destinationData.category}
                        </span>
                      </div>

                      {/* GALLERY */}
                      <div className="flex gap-2 overflow-x-auto">
                        {msg.destinationData.galleryUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="h-14 w-22 rounded-md object-cover border border-slate-200 shrink-0"
                          />
                        ))}
                      </div>

                      <p className="text-xs text-slate-600">{msg.destinationData.description}</p>

                      {/* COST BREAKDOWN */}
                      {msg.costEstimate && (
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between text-amber-700 font-semibold">
                            <span>
                              Cost Estimate — {msg.costEstimate.days} days, {msg.costEstimate.passengers} pax
                            </span>
                            <span className="font-mono">
                              KES {msg.costEstimate.totalKes.toLocaleString()} / ${msg.costEstimate.totalUsd}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-slate-600 pt-1 border-t border-slate-200">
                            <div>
                              {msg.costEstimate.vehicleType} hire:{' '}
                              KES {msg.costEstimate.vehicleTotalKes.toLocaleString()}
                            </div>
                            <div>Fuel: KES {msg.costEstimate.estimatedFuelKes.toLocaleString()}</div>
                            <div>Park fees: KES {msg.costEstimate.parkFeesKes.toLocaleString()}</div>
                            <div>Driver: KES {msg.costEstimate.driverAllowanceKes.toLocaleString()}</div>
                          </div>
                        </div>
                      )}

                      {/* ACTION BUTTON */}
                      {msg.suggestedAction && (
                        <button
                          onClick={() => navigate(msg.suggestedAction!.url)}
                          className="btn-primary w-full text-xs !py-2.5 flex items-center justify-center gap-1.5"
                        >
                          <Car className="h-4 w-4" /> {msg.suggestedAction.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-amber-700 p-3 bg-amber-50/80 rounded-xl max-w-xs border border-amber-200">
                <Sparkles className="h-4 w-4 animate-spin text-amber-600" /> Thinking…
              </div>
            )}
          </div>

          {/* PRESET CHIPS */}
          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
            {PRESET_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.text)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50/70 transition font-semibold shadow-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                {item.text}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Ask anything about travel, costs, vehicles, visas…"
              className="input-field !py-2.5 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => handleSend()}
              className="btn-primary !p-2.5 rounded-xl shrink-0"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CALCULATOR PANEL */}
        <div className="lg:col-span-5 p-4 flex flex-col space-y-4 bg-slate-50/70 border-l border-slate-200 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
            <h4 className="font-display font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
              <Calculator className="h-4 w-4 text-amber-600" /> Trip Cost Calculator
            </h4>
            <span className="text-[10px] text-teal font-mono font-semibold">Live Estimates</span>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Destination</label>
            <select
              className="input-field text-sm"
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
            >
              {KENYA_DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-700 font-semibold mb-1">Days</label>
              <input
                type="number"
                min={1}
                max={30}
                className="input-field text-sm !px-2 !py-2"
                value={calcDays}
                onChange={(e) => setCalcDays(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-700 font-semibold mb-1">Passengers</label>
              <input
                type="number"
                min={1}
                max={15}
                className="input-field text-sm !px-2 !py-2"
                value={calcPassengers}
                onChange={(e) => setCalcPassengers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-700 font-semibold mb-1">Vehicle</label>
              <select
                className="input-field text-xs !px-1 !py-2"
                value={calcVehicleType}
                onChange={(e) => setCalcVehicleType(e.target.value)}
              >
                <option value="SUV">4x4 SUV</option>
                <option value="VAN">Safari Van</option>
                <option value="CAR">Sedan</option>
              </select>
            </div>
          </div>

          {/* DESTINATION PREVIEW */}
          <div className="rounded-xl border border-slate-200 overflow-hidden relative group shadow-sm">
            <img
              src={currentDestination.imageUrl}
              alt={currentDestination.name}
              className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-2 left-3">
              <h5 className="font-display font-semibold text-sm text-white">{currentDestination.name}</h5>
              <p className="text-[10px] text-slate-200">{currentDestination.location}</p>
            </div>
          </div>

          {/* COST BREAKDOWN */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs text-slate-600 font-medium">Estimated Total</span>
              <div className="text-right">
                <span className="font-mono text-xl font-bold text-amber-600">
                  KES {calculatedResult.totalKes.toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-500">≈ ${calculatedResult.totalUsd} USD</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>
                  {calcVehicleType} hire ({calcDays}d × {calculatedResult.dailyRate.toLocaleString()}):
                </span>
                <span className="font-mono font-semibold">KES {calculatedResult.vehicleTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel ({currentDestination.distanceFromNairobiKm * 2} km):</span>
                <span className="font-mono font-semibold">KES {calculatedResult.fuelEst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Park fees ({calcPassengers} pax):</span>
                <span className="font-mono font-semibold">KES {calculatedResult.parkFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Driver allowance:</span>
                <span className="font-mono font-semibold">KES {calculatedResult.driverAllowance.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/search?type=${calcVehicleType}`)}
              className="btn-primary w-full text-xs !py-2.5 font-semibold"
            >
              Book {calcVehicleType} for {currentDestination.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
