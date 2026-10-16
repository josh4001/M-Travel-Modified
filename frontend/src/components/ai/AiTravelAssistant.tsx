import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  Car,
  Calculator,
  Compass,
  Palmtree,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import {
  getStoredDestinations,
  type TravelDestinationItem,
} from '@/lib/destinationsStore';
import {
  getStoredVehicles,
  isVehicleLive,
  isBusVehicle,
  getVehicleHireStatus,
  type StoredVehicle,
} from '@/lib/bookingStore';
import { getVehicleFallbackImage } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemInventory {
  liveDestinations: TravelDestinationItem[];
  liveVehicles: StoredVehicle[];
  availableVehicles: StoredVehicle[];
  onTripVehicles: StoredVehicle[];
  isEmpty: boolean;
}

export function getLiveSystemInventory(): SystemInventory {
  const allDestinations = getStoredDestinations();
  const liveDestinations = allDestinations.filter((d) => d.isLive !== false);

  const allVehicles = getStoredVehicles();
  const liveVehicles = allVehicles.filter(
    (v) => isVehicleLive(v.id) && (v.status || '').toUpperCase() === 'APPROVED'
  );

  const availableVehicles = liveVehicles.filter((v) => {
    const hire = getVehicleHireStatus(v.id);
    return !hire.isOnTrip && !hire.isAwaitingHandover;
  });

  const onTripVehicles = liveVehicles.filter((v) => {
    const hire = getVehicleHireStatus(v.id);
    return hire.isOnTrip || hire.isAwaitingHandover;
  });

  return {
    liveDestinations,
    liveVehicles,
    availableVehicles,
    onTripVehicles,
    isEmpty: liveDestinations.length === 0 && liveVehicles.length === 0,
  };
}

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

export interface AlternativeItem {
  id: string;
  type: 'DESTINATION' | 'VEHICLE';
  title: string;
  subtitle: string;
  priceText: string;
  url: string;
  imageUrl?: string;
  badge?: string;
  specs?: string[];
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  destinationData?: TravelDestinationItem;
  vehicleData?: StoredVehicle;
  costEstimate?: CostEstimate;
  suggestedAction?: SuggestedAction;
  alternatives?: {
    type: 'DESTINATION' | 'VEHICLE';
    items: AlternativeItem[];
  };
}

// ─── General Procedural Knowledge Base ────────────────────────────────────────

const PROCEDURAL_KNOWLEDGE = {
  mtravel:
    "**M-TRAVEL** is Kenya's premier independent travel marketplace. We connect travelers with verified fleet vehicles (4x4 SUVs, vans, buses, and sedans), curated safari expeditions, holiday villas, and luxury bus routes — all supported by 24/7 dedicated concierge assistance.",

  mpesa:
    "We provide **direct M-Pesa digital checkout, major cards, and instant reservation confirmation**. All bookings are secured with our trust escrow protocol, meaning funds are only disbursed once your vehicle or travel experience is successfully delivered and verified.",

  visaKenya:
    "Most international visitors obtain a **Kenya Electronic Travel Authorization (eTA)** online before arrival. East African Community citizens enjoy visa-free entry. Always verify entry conditions on official government portals before your journey.",

  packingList:
    "**Kenya Safari Packing Checklist**:\n• Sunscreen SPF 50+ & UV sunglasses\n• Insect repellent (DEET)\n• Neutral earth-tone clothing (khaki, beige, olive)\n• Sturdy walking boots\n• Camera with optical zoom lens\n• Compact headlamp / torch\n• Reusable thermal water bottle\n• Offline road maps downloaded prior to departure",

  malaria:
    "**Health & Malaria Advice**: Malaria risk exists in certain low-altitude and coastal zones across East Africa. Travelers often consult a travel clinic for prophylaxis (e.g., Malarone or Doxycycline), use repellent at dusk, and sleep under mosquito nets.",

  safety:
    "**Travel Safety in Kenya**: Safari destinations, protected national parks, and tourist transit routes are well-managed and monitored. Standard travel precautions apply — use accredited vehicles, keep documents in hotel safes, and travel with verified drivers.",

  currency:
    "**Currency & Payments**: The local currency is the Kenyan Shilling (KES). M-Pesa is universally accepted across restaurants, fuel stations, national parks, and local vendors throughout Kenya.",

  connectivity:
    "**Internet & SIM**: Safaricom and Airtel offer excellent 4G/5G coverage in Nairobi, major towns, and transit corridors. Some remote conservancies and deep valleys have limited coverage, so we recommend downloading offline navigation.",
};

function getDynamicGreeting(inv: SystemInventory, timeGreeting?: string): string {
  const prefix = timeGreeting || 'Hello! Welcome to M-TRAVEL.';
  if (inv.isEmpty) {
    return `${prefix} I'm on the M-TRAVEL Concierge Desk today. We currently don't have active vehicles or destinations published right this moment, but I'm happy to answer any questions about how our booking system, M-Pesa checkout, or fleet hosting works!`;
  }
  if (inv.liveDestinations.length > 0 && inv.availableVehicles.length > 0) {
    return `${prefix} I'm with the M-TRAVEL Concierge team. Right now we have **${inv.availableVehicles.length} verified vehicle(s)** ready for hire and **${inv.liveDestinations.length} active destination package(s)** in our system. How can I help you today?`;
  }
  if (inv.liveDestinations.length > 0) {
    return `${prefix} I'm with the M-TRAVEL Concierge team. We currently have **${inv.liveDestinations.length} active travel experience(s)** open for booking. How can I help you plan or book your trip today?`;
  }
  return `${prefix} I'm with the M-TRAVEL Concierge team. We currently have **${inv.availableVehicles.length} verified vehicle(s)** ready for immediate booking in our fleet. Which ride are you looking for, or how can I help you today?`;
}

// Helper to match a vehicle mentioned in a query against the live fleet
function findMatchingVehicleInQuery(q: string, vehicles: StoredVehicle[]): StoredVehicle | undefined {
  const clean = q.toLowerCase();
  // 1. Direct make/model/plate substring match against live vehicles
  const direct = vehicles.find((v) => {
    const make = (v.make || '').toLowerCase();
    const model = (v.model || '').toLowerCase();
    const fullName = `${make} ${model}`.trim();
    const plate = (v.plateNumber || '').toLowerCase();
    if (fullName && clean.includes(fullName)) return true;
    if (make.length >= 3 && clean.includes(make)) return true;
    // Match individual model words (e.g. "west", "coach", "prado", "cruiser", "coaster")
    const modelTokens = model.split(/\s+/).filter((t) => t.length >= 3);
    if (modelTokens.some((tok) => clean.includes(tok))) return true;
    if (plate && plate.length >= 4 && clean.includes(plate)) return true;
    return false;
  });
  if (direct) return direct;

  // 2. Category match (e.g. "bus", "coach", "suv", "van", "sedan", "pickup")
  if (/\b(bus|buses|coach|coaster)\b/.test(clean)) {
    return vehicles.find((v) => isBusVehicle(v) || `${v.make} ${v.model} ${v.type}`.toLowerCase().includes('bus') || `${v.make} ${v.model}`.toLowerCase().includes('coach'));
  }
  if (/\b(prado)\b/.test(clean)) {
    return vehicles.find((v) => `${v.make} ${v.model}`.toLowerCase().includes('prado'));
  }
  if (/\b(cruiser)\b/.test(clean)) {
    return vehicles.find((v) => `${v.make} ${v.model}`.toLowerCase().includes('cruiser'));
  }
  if (/\b(van|minibus)\b/.test(clean)) {
    return vehicles.find((v) => (v.type || '').toUpperCase() === 'VAN' || `${v.make} ${v.model}`.toLowerCase().includes('van'));
  }
  if (/\b(suv|4x4)\b/.test(clean)) {
    return vehicles.find((v) => (v.type || '').toUpperCase() === 'SUV' || (v.type || '').toUpperCase() === '4X4');
  }
  return undefined;
}

// ─── Real-Time Conversational AI Response Engine ───────────────────────────────

function buildLiveAiResponse(
  query: string,
  inv: SystemInventory,
  history: Message[] = []
): {
  text: string;
  dest?: TravelDestinationItem;
  vehicle?: StoredVehicle;
  cost?: CostEstimate;
  action?: SuggestedAction;
  alternatives?: {
    type: 'DESTINATION' | 'VEHICLE';
    items: AlternativeItem[];
  };
} {
  const q = query.toLowerCase().trim();

  // Extract conversational context (most recently discussed vehicle or destination)
  const lastAiWithVehicle = [...history].reverse().find((m) => m.sender === 'ai' && m.vehicleData);
  const lastAiWithDest = [...history].reverse().find((m) => m.sender === 'ai' && m.destinationData);
  const contextVehicle: StoredVehicle | undefined =
    findMatchingVehicleInQuery(q, inv.liveVehicles) || lastAiWithVehicle?.vehicleData;
  const contextDest: TravelDestinationItem | undefined = lastAiWithDest?.destinationData;

  // 1. NATURAL HUMAN GREETINGS & STAFF CONVERSATION
  // Check if user ONLY sent a greeting or pleasantry (or greeting + short pleasantry)
  const isPureGreeting =
    /^(good\s*morning|morning|good\s*afternoon|afternoon|good\s*evening|evening|good\s*night|goodnight|hi|hello|hey|jambo|habari|hujambo|sasa|mambo|niaje|greetings|howdy|sup|yo)[\s!.,?]*$/i.test(
      q
    );

  if (isPureGreeting) {
    if (/good\s*morning|^morning/i.test(q)) {
      return {
        text: getDynamicGreeting(
          inv,
          'Good morning! ☀️ Welcome to M-TRAVEL. I hope your day is off to a wonderful start!'
        ),
      };
    }
    if (/good\s*afternoon|^afternoon/i.test(q)) {
      return {
        text: getDynamicGreeting(
          inv,
          'Good afternoon! Welcome to M-TRAVEL. I hope you are having a great day so far!'
        ),
      };
    }
    if (/good\s*evening|^evening/i.test(q)) {
      return {
        text: getDynamicGreeting(
          inv,
          'Good evening! Welcome to M-TRAVEL. I hope you had a lovely day!'
        ),
      };
    }
    if (/good\s*night|goodnight/i.test(q)) {
      return {
        text: "Good night! 🌙 Have a wonderful, restful night. Whenever you're ready to book a vehicle, charter a bus, or plan your next trip with M-TRAVEL, we'll be right here to help!",
      };
    }
    if (/jambo|habari|hujambo|sasa|mambo|niaje/i.test(q)) {
      return {
        text: getDynamicGreeting(
          inv,
          'Jambo! Karibu sana to M-TRAVEL. It is a pleasure speaking with you today!'
        ),
      };
    }
    return {
      text: getDynamicGreeting(inv, 'Hello there! 👋 Welcome to M-TRAVEL.'),
    };
  }

  // "How are you?" / pleasantries
  if (/^(how are you|how's it going|how are things|how do you do|hope you are well|are you there)[\s!.,?]*$/i.test(q)) {
    return {
      text: `I'm doing great, thank you so much for asking! 😊 I'm right here at the M-TRAVEL Concierge Desk and ready to help. We currently have **${inv.availableVehicles.length} available vehicle(s)**${
        inv.liveDestinations.length > 0 ? ` and **${inv.liveDestinations.length} destination package(s)**` : ''
      } in our system. How are you doing today, and what can I help you check or book?`,
    };
  }

  // "Thank you" / "Thanks" / acknowledgements
  if (/^(thank you|thanks|thx|thank u|asante|asante sana|shukran|appreciate it|many thanks)[\s!.,?]*$/i.test(q)) {
    return {
      text: `You're very welcome! 😊 It's always my pleasure to help. Please let me know if you need anything else — whether it's booking ${
        contextVehicle ? `the **${contextVehicle.make} ${contextVehicle.model}**` : 'a vehicle'
      }, checking rates, or learning how M-Pesa checkout works!`,
      ...(contextVehicle
        ? {
            action: {
              label: `Book ${contextVehicle.make} ${contextVehicle.model}`,
              url: `/vehicles/${contextVehicle.id}`,
            },
          }
        : {}),
    };
  }

  // "Okay" / "Great" / "Awesome" / "Got it"
  if (/^(ok|okay|k|alright|cool|great|awesome|nice|perfect|understood|got it|sounds good)[\s!.,?]*$/i.test(q)) {
    if (contextVehicle) {
      return {
        text: `Wonderful! Whenever you're ready to reserve the **${contextVehicle.make} ${contextVehicle.model}**, just click the button below to open its booking page, choose your travel dates, and complete checkout. Let me know if you have any other questions!`,
        action: {
          label: `Go to ${contextVehicle.make} ${contextVehicle.model} Booking Page`,
          url: `/vehicles/${contextVehicle.id}`,
        },
      };
    }
    return {
      text: "Great! Just let me know if there's any vehicle, bus, or travel question I can help you with.",
    };
  }

  // "Bye" / "Goodbye"
  if (/^(bye|goodbye|see you|see ya|talk later|have a good day|kwaheri)[\s!.,?]*$/i.test(q)) {
    return {
      text: "Goodbye and safe travels! 👋 Thank you for chatting with M-TRAVEL. Whenever you need a vehicle or travel assistance, feel free to reach out anytime!",
    };
  }

  // Check if the user started their question with a greeting (e.g., "Good morning, how can I book the Isuzu bus?")
  let greetingLeadIn = '';
  if (/\bgood\s*morning\b/i.test(q)) greetingLeadIn = 'Good morning! ☀️ ';
  else if (/\bgood\s*afternoon\b/i.test(q)) greetingLeadIn = 'Good afternoon! ';
  else if (/\bgood\s*evening\b/i.test(q)) greetingLeadIn = 'Good evening! ';
  else if (/\b(hi|hello|hey|jambo|habari)\b/i.test(q)) greetingLeadIn = 'Hello! ';

  // 2. BOOKING INSTRUCTIONS & "HOW CAN I BOOK IT?" (CONTEXT-AWARE + SYSTEM-WIDE)
  const isHowToBookQuery =
    /\b(how\s+(can|do|to|would|should)\s+(i|we|someone|a traveler)\s+(book|reserve|hire|rent|get|pay for)|how\s+to\s+(book|reserve|hire|rent)|steps?\s+to\s+book|booking\s+process|how\s+does\s+booking\s+work|can\s+i\s+book\s+(it|this|that|the)|i\s+want\s+to\s+(book|reserve|hire|rent)|where\s+(can|do)\s+i\s+book|book\s+it|reserve\s+it|hire\s+it)\b/i.test(
      q
    );

  if (isHowToBookQuery) {
    if (contextVehicle) {
      const isBus = isBusVehicle(contextVehicle);
      const hireStatus = getVehicleHireStatus(contextVehicle.id);

      if (hireStatus.isOnTrip || hireStatus.isAwaitingHandover) {
        return {
          text:
            `${greetingLeadIn}The **${contextVehicle.make} ${contextVehicle.model}** is currently booked out on an active trip${
              hireStatus.returnDate ? ` until ${hireStatus.returnDate}` : ''
            }. As soon as the vehicle returns and passes our Admin Return Inspection, it will immediately become available for booking again!\n\n` +
            `In the meantime, you can book any of our other available vehicles by clicking **View Available Fleet** below.`,
          action: {
            label: 'View Available Fleet',
            url: '/catalogue',
          },
        };
      }

      const driverAndDocsStep = isBus
        ? `3. **Driver & Pickup Documents**: Because this is a bus charter, a **certified M-TRAVEL company coach driver is automatically included** (no self-drive option and no driver's license needed from you). You only need to bring your **original National ID or Passport** for physical handover verification.`
        : `3. **Service Mode & Documents**: Choose **Self-Drive** (bring your original National ID/Passport + valid Driving License at pickup) or **With Chauffeur** (+KES 2,500/day, National ID/Passport only).`;

      return {
        text:
          `${greetingLeadIn}Booking the **${contextVehicle.make} ${contextVehicle.model}** on M-TRAVEL is quick and straightforward! Here is how you can book it right now:\n\n` +
          `1. **Open the Booking Page**: Click the **"Book ${contextVehicle.make} ${contextVehicle.model}"** button right below (or select it from our **Fleet Catalogue**).\n` +
          `2. **Select Travel Dates & Times**: Enter your **Pick-up Date & Time**, **Return Date & Time**, and pickup/drop-off locations. The system automatically calculates your total at **KES ${contextVehicle.pricePerDay.toLocaleString()}/day**.\n` +
          `${driverAndDocsStep}\n` +
          `4. **Pay via M-Pesa or Wallet**: Enter your M-Pesa phone number to complete instant checkout (or pay directly from your M-TRAVEL Wallet if funded). Remember to sign in to your **Traveler Account** first.\n` +
          `5. **Get Your Booking Pass**: Once confirmed, you'll receive an instant confirmation email/WhatsApp and can download your official **PDF Expedition Pass** under **My Bookings**!`,
        vehicle: contextVehicle,
        action: {
          label: `Book ${contextVehicle.make} ${contextVehicle.model} Now`,
          url: `/vehicles/${contextVehicle.id}`,
        },
      };
    }

    if (contextDest) {
      return {
        text:
          `${greetingLeadIn}Here is how to book **${contextDest.title}** on M-TRAVEL:\n\n` +
          `1. **Go to Holidays & Tours**: Click the **"Book ${contextDest.title}"** button below.\n` +
          `2. **Choose Your Travel Dates & Guests**: Select your preferred departure date and number of travelers (**KES ${contextDest.priceKES.toLocaleString()} ${contextDest.priceUnit || '/ person'}**).\n` +
          `3. **Complete M-Pesa or Wallet Checkout**: Confirm your reservation with instant M-Pesa payment or your M-TRAVEL Wallet.\n` +
          `4. **Receive Your Travel Voucher**: Your confirmed itinerary voucher and booking reference will appear immediately in **My Bookings** and be sent to your email!`,
        dest: contextDest,
        action: {
          label: `Book ${contextDest.title}`,
          url: '/holidays',
        },
      };
    }

    // General "How can I book?" without a prior vehicle in context
    return {
      text:
        `${greetingLeadIn}Booking a vehicle, bus, or safari trip on **M-TRAVEL** takes less than 2 minutes! Here is the step-by-step process:\n\n` +
        `1. **Sign In / Create a Traveler Account**: Click **Sign In / Register** at the top navigation bar.\n` +
        `2. **Choose Your Ride or Destination**: Browse the **Fleet Catalogue** (for 4x4 SUVs, cars, and charter buses) or **Holidays & Tours** and click on the listing you want.\n` +
        `3. **Pick Your Travel Dates & Times**: Select your pick-up and return dates/times. For regular vehicles, you can choose **Self-Drive** or **Chauffeur-Driven** (buses automatically come with a certified company coach captain).\n` +
        `4. **Checkout with M-Pesa or Wallet**: Pay securely via M-Pesa STK push or your M-TRAVEL Wallet.\n` +
        `5. **Download Your Pass & Pick Up**: Download your **PDF Booking Pass** from **My Bookings** and present your ID (plus Driving License for self-drive cars) at our station hub for vehicle handover!`,
      action: {
        label: 'Browse Available Fleet to Book',
        url: '/catalogue',
      },
    };
  }

  // 3. CONTEXTUAL FOLLOW-UP QUESTIONS ABOUT THE CURRENT VEHICLE ("how much for 3 days?", "does it have a driver?", "what documents?", "where is it located?")
  if (contextVehicle) {
    // Follow-up about multi-day pricing / cost for "it" or the vehicle
    const daysMatch = q.match(/(\d+)\s*day/);
    if (
      daysMatch ||
      /\b(how much is it|what is the price|how much does it cost|price per day|daily rate|total cost)\b/i.test(q)
    ) {
      const days = daysMatch ? Math.max(1, parseInt(daysMatch[1], 10)) : 1;
      const total = contextVehicle.pricePerDay * days;
      const isBus = isBusVehicle(contextVehicle);
      return {
        text:
          `${greetingLeadIn}The **${contextVehicle.make} ${contextVehicle.model}** is **KES ${contextVehicle.pricePerDay.toLocaleString()} per day**.\n\n` +
          `• **Cost for ${days} day(s)**: **KES ${total.toLocaleString()}**\n` +
          `• **Driver / Captain**: ${
            isBus
              ? 'Included in the daily rate (Certified M-TRAVEL Coach Captain provided)'
              : 'Self-Drive included, or add a certified station chauffeur for +KES 2,500/day'
          }\n` +
          `• **Insurance**: Comprehensive commercial & PSV insurance included.\n\n` +
          `Would you like to go ahead and book it for ${days} day(s)?`,
        vehicle: contextVehicle,
        action: {
          label: `Book ${contextVehicle.make} ${contextVehicle.model}`,
          url: `/vehicles/${contextVehicle.id}`,
        },
      };
    }

    // Follow-up about driver / chauffeur / self-drive for the vehicle
    if (/\b(driver|chauffeur|captain|self.?drive|who drives)\b/i.test(q)) {
      const isBus = isBusVehicle(contextVehicle);
      return {
        text: isBus
          ? `${greetingLeadIn}Yes! Since the **${contextVehicle.make} ${contextVehicle.model}** is an executive charter bus, it **automatically comes with a certified M-TRAVEL company coach driver** included in your booking. Self-drive is not required for buses, so you only need to present your **National ID or Passport** at pickup!`
          : `${greetingLeadIn}For the **${contextVehicle.make} ${contextVehicle.model}**, you have two flexible options on the booking page:\n\n` +
            `• **Self-Drive**: Drive yourself (requires your original National ID/Passport + valid Driving License at handover).\n` +
            `• **With Certified Chauffeur**: Add an experienced M-TRAVEL driver during checkout (+KES 2,500/day) and simply present your National ID/Passport at pickup!`,
        vehicle: contextVehicle,
        action: {
          label: `Book ${contextVehicle.make} ${contextVehicle.model}`,
          url: `/vehicles/${contextVehicle.id}`,
        },
      };
    }

    // Follow-up about documents / requirements / pickup / handover for the vehicle
    if (/\b(document|id|passport|license|licence|require|pickup|pick up|handover|collect|where is it)\b/i.test(q)) {
      const isBus = isBusVehicle(contextVehicle);
      return {
        text:
          `${greetingLeadIn}For the **${contextVehicle.make} ${contextVehicle.model}**, here are the pickup and document details:\n\n` +
          `• **Pickup Hub**: ${contextVehicle.address || 'M-TRAVEL Station Hub, Nairobi'}\n` +
          `• **Required Documents at Handover**: ${
            isBus
              ? '**Original National ID or Passport only** (A company coach driver is assigned to your bus, so no driving license is needed from you).'
              : '**Original National ID or Passport + Valid Driving License** for Self-Drive (or National ID/Passport only if you select a Chauffeur).'
          }\n` +
          `• **Handover Process**: Once you arrive at the station, our M-TRAVEL Admin verifies your booking pass and documents and releases the vehicle to you immediately!`,
        vehicle: contextVehicle,
        action: {
          label: `Book ${contextVehicle.make} ${contextVehicle.model}`,
          url: `/vehicles/${contextVehicle.id}`,
        },
      };
    }
  }

  // 4. SYSTEM-SPECIFIC OPERATIONAL QUESTIONS (Handover, Return Inspection, Hosts, Wallet, Account, Cancellations, Incidents, Contact)
  if (/\b(document|id|passport|driving\s*licen[cs]e|handover|pick\s*up\s*process|return\s*inspection|late\s*return|overdue|credit\s*score)\b/i.test(q)) {
    return {
      text:
        `${greetingLeadIn}Here is how **Vehicle Handover, Documents & Return Inspection** work on M-TRAVEL:\n\n` +
        `• **Self-Drive Cars & SUVs**: Bring your **Original National ID (or Passport)** and a **valid Driving License** at pickup.\n` +
        `• **Buses & Chauffeur Rides**: Every bus charter includes a certified M-TRAVEL coach driver, so travelers only need to present their **Original National ID or Passport**.\n` +
        `• **Return Inspection & Immediate Re-Booking**: When you return a vehicle or bus, our **M-TRAVEL Admin** completes a quick Return Inspection (checking condition, fuel, and odometer). Once verified — whether returned early, on time, or after the due date — the trip is marked completed and the vehicle is immediately freed for new bookings!`,
      action: {
        label: 'View My Bookings',
        url: '/dashboard/bookings',
      },
    };
  }

  if (/\b(host|list\s+my\s+(car|vehicle|bus)|rent\s+out\s+my|owner|partner|commission|payout|earn\s+money)\b/i.test(q)) {
    return {
      text:
        `${greetingLeadIn}You can partner with **M-TRAVEL** as a **Fleet Host** and earn from your vehicles or buses!\n\n` +
        `1. **Register a Fleet Host Account**: Click **Sign In / Register** and select the **Vehicle Owner / Fleet Host** role.\n` +
        `2. **Submit Your Vehicle**: From your **Host Dashboard**, add your vehicle's make, model, plate number, daily rate in KES, and clear photos.\n` +
        `3. **Admin Quality Inspection**: **M-TRAVEL Admin** reviews and approves roadworthy vehicles so they go live on the marketplace.\n` +
        `4. **Automatic Earnings (75% Payout)**: Whenever a traveler books your vehicle and handover is verified, **75%** of the booking value is credited to your personal **Host Wallet** (with 25% platform service commission), ready for M-Pesa withdrawal anytime!`,
      action: {
        label: 'Register as a Fleet Host',
        url: '/register',
      },
    };
  }

  if (/\b(cancel|cancellation|refund|change\s+date|reschedule)\b/i.test(q)) {
    return {
      text:
        `${greetingLeadIn}Here is how **Cancellations & Refunds** work on M-TRAVEL:\n\n` +
        `• **Before Handover**: All booking payments are protected in our **M-TRAVEL Trust Escrow** until physical vehicle handover takes place.\n` +
        `• **Managing Your Reservation**: You can view your active reservations anytime under **My Bookings** in your dashboard, download your booking pass, or contact our 24/7 Concierge Desk via WhatsApp (` +
        `**+254 791 888 840**) if you need assistance adjusting your dates or cancelling prior to dispatch.`,
      action: {
        label: 'Open My Bookings',
        url: '/dashboard/bookings',
      },
    };
  }

  if (/\b(incident|breakdown|accident|emergency|roadside|help\s+on\s+trip|support|contact|phone\s*number|whatsapp|call|email|office|location|address)\b/i.test(q)) {
    return {
      text:
        `${greetingLeadIn}Our **M-TRAVEL 24/7 Concierge & Roadside Support Team** is always here for you:\n\n` +
        `• **24/7 Concierge Hotline**: **+254 722 374 535**\n` +
        `• **WhatsApp Operations Desk**: **+254 791 888 840**\n` +
        `• **Support Email**: **support@mtravel.co.ke**\n` +
        `• **Station Hub**: Westlands Square, Nairobi, Kenya\n` +
        `• **On-Trip Incident Reporting**: If you are currently on an active trip, you can also log a roadside or safety alert directly from **My Bookings** so our Admin team can dispatch immediate assistance!`,
      action: {
        label: 'Chat with Concierge on WhatsApp',
        url: 'https://wa.me/254791888840?text=Hello%20M-TRAVEL%20Concierge,%20I%20would%20like%20assistance%20with%20my%20booking.',
      },
    };
  }

  if (/\b(account|sign\s*up|register|login|log\s*in|forgot\s*password|reset\s*password|otp|profile)\b/i.test(q)) {
    return {
      text:
        `${greetingLeadIn}Managing your **M-TRAVEL Account** is simple and secure:\n\n` +
        `• **Travelers & Fleet Hosts**: Click **Sign In / Register** at the top right to create your account or sign in.\n` +
        `• **Forgot Password**: On the login page, click **Forgot Password?** to receive a 6-digit **One-Time Verification Code (OTP)** in your email and set a new password.\n` +
        `• **Personal Wallet & Bookings**: Every user has their own dedicated **Wallet**, **My Bookings** pass centre, and **My Profile** dashboard.`,
      action: {
        label: 'Go to Sign In / Register',
        url: '/login',
      },
    };
  }

  // 5. CHECK IF SYSTEM IS COMPLETELY EMPTY
  if (inv.isEmpty) {
    if (/mpesa|payment|pay|card|wallet/.test(q)) {
      return {
        text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.mpesa}\n\n*(Note: Our marketplace catalogue currently does not have active vehicles or destinations available at the moment. Please try again later.)*`,
      };
    }
    if (/visa|entry|passport|permit/.test(q)) {
      return {
        text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.visaKenya}`,
      };
    }
    if (/pack|luggage|gear|clothing/.test(q)) {
      return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.packingList}` };
    }
    if (/malaria|health|vaccine/.test(q)) {
      return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.malaria}` };
    }
    if (/vehicle|car|bus|coach|fleet|destination|safari|holiday|tour|available|book|hire|rent/.test(q)) {
      return {
        text: `${greetingLeadIn}We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our 24/7 Concierge Support Desk for upcoming schedule releases.`,
        action: {
          label: 'Contact Concierge Desk',
          url: 'https://wa.me/254791888840?text=Hello%20M-TRAVEL,%20I%20would%20like%20to%20inquire%20about%20upcoming%20destinations%20and%20fleet%20availability',
        },
      };
    }
  }

  // 6. PROCEDURAL GENERAL QUESTIONS
  if (/m.?travel|about us|who are you|what do you do|your company|your platform|how does this system work/.test(q)) {
    return {
      text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.mtravel}\n\n**Current Live System Status**:\n• Verified Active Vehicles: **${inv.availableVehicles.length} available**${inv.onTripVehicles.length > 0 ? ` (${inv.onTripVehicles.length} currently on trip)` : ''}\n• Published Destinations / Tours: **${inv.liveDestinations.length} active**`,
      action: {
        label: inv.liveDestinations.length > 0 ? 'Browse Live Destinations' : 'View Fleet Catalogue',
        url: inv.liveDestinations.length > 0 ? '/holidays' : '/catalogue',
      },
    };
  }

  if (/\b(mpesa|m-pesa|payment|pay|card|mastercard|wallet|top\s*up|withdraw|escrow)\b/.test(q)) {
    return {
      text:
        `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.mpesa}\n\n` +
        `• **Every User Has Their Own Wallet**: Travelers can top up their wallet via M-Pesa or pay directly at checkout, and Fleet Hosts receive their 75% booking payouts into their personal Host Wallet once vehicle handover is verified.`,
    };
  }

  if (/\b(visa|eta|entry|immigration)\b/.test(q)) {
    return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.visaKenya}` };
  }

  if (/\b(pack|what to bring|luggage|clothes|kit|gear)\b/.test(q)) {
    return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.packingList}` };
  }

  if (/\b(malaria|health|vaccine|vaccination|medicine|mosquito)\b/.test(q)) {
    return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.malaria}` };
  }

  if (/\b(currency|money|exchange|shilling|kes|usd|forex)\b/.test(q)) {
    return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.currency}` };
  }

  if (/\b(safe|safety|security|is kenya safe)\b/.test(q)) {
    return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.safety}` };
  }

  if (/\b(sim|internet|wifi|data|network|safaricom|connectivity)\b/.test(q)) {
    return { text: `${greetingLeadIn}${PROCEDURAL_KNOWLEDGE.connectivity}` };
  }

  // 7. CHECK SPECIFIC VEHICLE MENTIONS OR FLEET QUERIES
  const matchedDirectVehicle = findMatchingVehicleInQuery(q, inv.liveVehicles);
  const vehicleKeywords = [
    'vehicle', 'vehicles', 'car', 'cars', 'suv', 'van', 'prado', 'land cruiser', 'cruiser', '4x4', 'pickup',
    'fleet', 'hire', 'rent', 'bus', 'buses', 'coaster', 'coach', 'sedan',
    'toyota', 'isuzu', 'subaru', 'mercedes', 'vitz', 'harrier', 'rav4', 'minibus', 'scania', 'nissan', 'mitsubishi',
    'available', 'ride', 'rides', 'cheapest', 'seat', 'seats'
  ];
  const isVehicleQuery = Boolean(matchedDirectVehicle) || vehicleKeywords.some((k) => q.includes(k));

  if (isVehicleQuery) {
    // Check if user mentioned a specific model or brand
    const requestedModel =
      matchedDirectVehicle ? `${matchedDirectVehicle.make} ${matchedDirectVehicle.model}` :
      q.includes('prado') ? 'Toyota Land Cruiser Prado' :
      q.includes('land cruiser') || q.includes('cruiser') ? 'Toyota Land Cruiser' :
      q.includes('isuzu') ? 'Isuzu Coach / Bus' :
      q.includes('coach') || q.includes('bus') ? 'Tour Coach / Bus' :
      q.includes('van') || q.includes('minibus') ? 'Safari Minibus Van' :
      q.includes('rav4') ? 'Toyota RAV4' :
      q.includes('subaru') ? 'Subaru' :
      q.includes('mercedes') ? 'Mercedes-Benz' :
      q.includes('sedan') ? 'Executive Sedan' :
      q.includes('pickup') ? '4x4 Pickup' : null;

    if (requestedModel) {
      const matchedVehicle = matchedDirectVehicle;

      if (matchedVehicle) {
        const hireStatus = getVehicleHireStatus(matchedVehicle.id);
        const isBus = isBusVehicle(matchedVehicle);

        if (hireStatus.isOnTrip) {
          let text = `${greetingLeadIn}The **${matchedVehicle.make} ${matchedVehicle.model}** is **currently on an active trip with a traveler**${
            hireStatus.returnDate ? ` until ${hireStatus.returnDate}` : ''
          }. Once it is returned and verified through our Admin Return Inspection, it will immediately open up for booking again.\n\n`;

          if (inv.availableVehicles.length > 0) {
            text += `Here are alternative vehicles **currently available** in our active fleet:\n\n`;
            inv.availableVehicles.slice(0, 3).forEach((v) => {
              text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
            });
            text += `\nWould you like to reserve one of these available alternatives?`;

            return {
              text,
              alternatives: {
                type: 'VEHICLE',
                items: inv.availableVehicles.slice(0, 3).map((v) => ({
                  id: v.id,
                  type: 'VEHICLE',
                  title: `${v.make} ${v.model}`,
                  subtitle: `${v.seats} Seats · ${v.transmission} · ${v.fuelType}`,
                  priceText: `KES ${v.pricePerDay.toLocaleString()} / day`,
                  url: `/vehicles/${v.id}`,
                  imageUrl: v.images?.[0],
                  specs: [`${v.seats} Seats`, v.transmission, v.fuelType],
                })),
              },
              action: {
                label: 'View Available Fleet',
                url: '/catalogue',
              },
            };
          } else {
            text += `There are currently no other vehicles available in the fleet. Please check back soon once this vehicle completes its return inspection.`;
            return { text };
          }
        }

        if (hireStatus.isAwaitingHandover) {
          let text = `${greetingLeadIn}The **${matchedVehicle.make} ${matchedVehicle.model}** is **currently reserved and awaiting handover**.\n\n`;
          if (inv.availableVehicles.length > 0) {
            text += `Here are alternative vehicles **currently available** in our fleet:\n\n`;
            inv.availableVehicles.slice(0, 3).forEach((v) => {
              text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
            });
            return {
              text,
              alternatives: {
                type: 'VEHICLE',
                items: inv.availableVehicles.slice(0, 3).map((v) => ({
                  id: v.id,
                  type: 'VEHICLE',
                  title: `${v.make} ${v.model}`,
                  subtitle: `${v.seats} Seats · ${v.transmission} · ${v.fuelType}`,
                  priceText: `KES ${v.pricePerDay.toLocaleString()} / day`,
                  url: `/vehicles/${v.id}`,
                  imageUrl: v.images?.[0],
                })),
              },
              action: { label: 'View Available Fleet', url: '/catalogue' },
            };
          }
          text += `No other vehicles are currently available in the fleet. Please try again later.`;
          return { text };
        }

        // Available!
        return {
          text:
            `${greetingLeadIn}Yes! The **${matchedVehicle.make} ${matchedVehicle.model} (${matchedVehicle.year})** is **currently available for hire** in our fleet!\n\n` +
            `• **Daily Rate**: KES ${matchedVehicle.pricePerDay.toLocaleString()}/day\n` +
            `• **Capacity**: ${matchedVehicle.seats} Passengers\n` +
            `• **Transmission**: ${matchedVehicle.transmission} · **Fuel**: ${matchedVehicle.fuelType}\n` +
            `• **Service Mode**: ${
              isBus
                ? 'Executive Bus Charter (Certified M-TRAVEL Coach Driver Included)'
                : 'Self-Drive or Chauffeur-Driven'
            }\n` +
            `• **Pickup Location**: ${matchedVehicle.address || 'Nairobi, Kenya'}\n\n` +
            `To book it right now, simply click the **"Book ${matchedVehicle.make} ${matchedVehicle.model}"** button below, choose your travel dates, and complete your M-Pesa or Wallet payment!`,
          vehicle: matchedVehicle,
          action: {
            label: `Book ${matchedVehicle.make} ${matchedVehicle.model}`,
            url: `/vehicles/${matchedVehicle.id}`,
          },
        };
      }

      // The requested model is NOT in live fleet
      let text = `${greetingLeadIn}We don't currently have a **${requestedModel}** listed in our active fleet right now.\n\n`;
      if (inv.availableVehicles.length > 0) {
        text += `However, we have these verified vehicles **ready for immediate booking**:\n\n`;
        inv.availableVehicles.slice(0, 3).forEach((v) => {
          text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
        });
        text += `\nWould you like to book one of these available options, or hear more about any of them?`;
        return {
          text,
          alternatives: {
            type: 'VEHICLE',
            items: inv.availableVehicles.slice(0, 3).map((v) => ({
              id: v.id,
              type: 'VEHICLE',
              title: `${v.make} ${v.model}`,
              subtitle: `${v.seats} Seats · ${v.transmission} · ${v.fuelType}`,
              priceText: `KES ${v.pricePerDay.toLocaleString()} / day`,
              url: `/vehicles/${v.id}`,
              imageUrl: v.images?.[0],
            })),
          },
          action: { label: 'Explore Fleet Catalogue', url: '/catalogue' },
        };
      } else {
        text = `${greetingLeadIn}We currently do not have active vehicles available in our fleet at the moment. Please try again later.`;
        return { text };
      }
    }

    // General vehicle fleet question ("What vehicles do you have?", "Which cars are available?")
    if (inv.availableVehicles.length === 0 && inv.liveVehicles.length === 0) {
      return {
        text: `${greetingLeadIn}There are currently no vehicles available for hire in our fleet at the moment. Please try again later or check back soon as hosts add new vehicles.`,
      };
    }

    let text = `${greetingLeadIn}Here are the vehicles **currently in our active M-TRAVEL fleet**:\n\n`;
    inv.liveVehicles.forEach((v) => {
      const hire = getVehicleHireStatus(v.id);
      const statusText = hire.isOnTrip
        ? `⚠️ *(Currently on trip${hire.returnDate ? ` until ${hire.returnDate}` : ''})*`
        : hire.isAwaitingHandover
        ? `🔒 *(Booked · Awaiting departure)*`
        : `✅ *(Available for immediate booking)*`;
      text += `• **${v.make} ${v.model} (${v.year})** — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats · ${statusText}\n`;
    });
    text += `\nClick **"View & Book"** on any vehicle card below to choose your dates and reserve it!`;

    if (inv.availableVehicles.length > 0) {
      return {
        text,
        alternatives: {
          type: 'VEHICLE',
          items: inv.availableVehicles.slice(0, 4).map((v) => ({
            id: v.id,
            type: 'VEHICLE',
            title: `${v.make} ${v.model}`,
            subtitle: `${v.seats} Seats · ${v.transmission} · ${v.fuelType}`,
            priceText: `KES ${v.pricePerDay.toLocaleString()} / day`,
            url: `/vehicles/${v.id}`,
            imageUrl: v.images?.[0],
          })),
        },
        action: { label: 'View Fleet Catalogue', url: '/catalogue' },
      };
    }

    return { text };
  }

  // 8. DESTINATION MATCHING AGAINST CURRENT LIVE SYSTEM DATA
  const matchingLiveDest = inv.liveDestinations.find((d) => {
    const t = (d.title || '').toLowerCase();
    const loc = (d.location || '').toLowerCase();
    const reg = (d.region || '').toLowerCase();
    const tokens = q.split(/\s+/).filter((w) => w.length >= 4);

    return (
      tokens.some((tok) => t.includes(tok) || loc.includes(tok) || reg.includes(tok)) ||
      (q.includes('mara') && (t.includes('mara') || loc.includes('mara'))) ||
      (q.includes('diani') && (t.includes('diani') || loc.includes('diani'))) ||
      (q.includes('amboseli') && (t.includes('amboseli') || loc.includes('amboseli'))) ||
      (q.includes('naivasha') && (t.includes('naivasha') || loc.includes('naivasha'))) ||
      (q.includes('tsavo') && (t.includes('tsavo') || loc.includes('tsavo'))) ||
      (q.includes('kenya') && t.includes('kenya'))
    );
  });

  if (matchingLiveDest) {
    const daysMatch = q.match(/(\d+)\s*day/);
    const paxMatch = q.match(/(\d+)\s*(person|people|passenger|pax)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 3;
    const passengers = paxMatch ? parseInt(paxMatch[1]) : 4;

    const matchedVeh = inv.availableVehicles[0];
    const dailyRate = matchedVeh ? matchedVeh.pricePerDay : 12000;
    const vehicleType = matchedVeh ? `${matchedVeh.make} ${matchedVeh.model}` : '4x4 SUV';
    const vehicleTotal = dailyRate * days;
    const estimatedFuel = days * 3500;
    const parkFees = 1500 * passengers * days;
    const driverAllowance = days * 2000;
    const totalKes = vehicleTotal + estimatedFuel + parkFees + driverAllowance;

    const highlightsText =
      matchingLiveDest.details?.highlights && matchingLiveDest.details.highlights.length > 0
        ? `\n• **Highlights**: ${matchingLiveDest.details.highlights.slice(0, 3).join(', ')}`
        : '';

    const text =
      `${greetingLeadIn}Great choice! Here are the details for **${matchingLiveDest.title}** currently available in our system:\n\n` +
      `• **Location**: ${matchingLiveDest.location}\n` +
      `• **Price**: KES ${matchingLiveDest.priceKES.toLocaleString()} ${matchingLiveDest.priceUnit || '/ person'}` +
      `${highlightsText}\n` +
      `• **Overview**: ${matchingLiveDest.details?.overview || matchingLiveDest.subtitle}\n\n` +
      `I've calculated your estimated itinerary cost below for **${days} days, ${passengers} passenger(s)**${
        matchedVeh ? ` paired with our available **${matchedVeh.make} ${matchedVeh.model}**` : ''
      }.`;

    return {
      text,
      dest: matchingLiveDest,
      cost: {
        destinationName: matchingLiveDest.title,
        days,
        passengers,
        vehicleType,
        dailyRateKes: dailyRate,
        vehicleTotalKes: vehicleTotal,
        estimatedFuelKes: estimatedFuel,
        parkFeesKes: parkFees,
        driverAllowanceKes: driverAllowance,
        totalKes,
        totalUsd: Math.round(totalKes / 130),
      },
      action: {
        label: `Book ${matchingLiveDest.title}`,
        url: '/holidays',
      },
    };
  }

  const knownDestinationNames: Record<string, string> = {
    mara: 'Maasai Mara National Reserve',
    masai: 'Maasai Mara National Reserve',
    wildebeest: 'Maasai Mara (Wildebeest Migration)',
    amboseli: 'Amboseli National Park',
    kilimanjaro: 'Amboseli / Mount Kilimanjaro',
    diani: 'Diani Beach & South Coast',
    naivasha: 'Lake Naivasha',
    'hells gate': "Hell's Gate National Park",
    'mount kenya': 'Mount Kenya National Park',
    'mt kenya': 'Mount Kenya National Park',
    tsavo: 'Tsavo National Parks',
    serengeti: 'Serengeti Safari',
    zanzibar: 'Zanzibar Island',
    mombasa: 'Mombasa Coastal Tour',
    samburu: 'Samburu National Reserve',
    nakuru: 'Lake Nakuru',
    watamu: 'Watamu Beach',
    lamu: 'Lamu Old Town',
  };

  const matchedKnownKeyword = Object.keys(knownDestinationNames).find((k) => q.includes(k));

  if (matchedKnownKeyword) {
    const missingDestName = knownDestinationNames[matchedKnownKeyword];
    let text = `${greetingLeadIn}**"${missingDestName}"** is currently **not listed as a pre-packaged tour** in our active catalogue.\n\n`;

    if (inv.liveDestinations.length > 0) {
      text += `However, we currently have the following verified travel experiences **available in our system** as great alternatives:\n\n`;
      inv.liveDestinations.slice(0, 3).forEach((d) => {
        text += `• **${d.title}** (${d.location}) — KES ${d.priceKES.toLocaleString()} ${d.priceUnit || '/ person'}\n`;
      });
      text += `\nWould you like details or an itinerary for any of these available destinations?`;

      return {
        text,
        alternatives: {
          type: 'DESTINATION',
          items: inv.liveDestinations.slice(0, 3).map((d) => ({
            id: d.id,
            type: 'DESTINATION',
            title: d.title,
            subtitle: d.location,
            priceText: `KES ${d.priceKES.toLocaleString()} ${d.priceUnit || ''}`,
            url: '/holidays',
            imageUrl: d.imageUrl,
            badge: d.badge,
            specs: d.specs,
          })),
        },
        action: {
          label: `Explore ${inv.liveDestinations[0].title}`,
          url: '/holidays',
        },
      };
    }

    if (inv.availableVehicles.length > 0) {
      text += `However, we have **${inv.availableVehicles.length} verified vehicle(s)** ready for custom self-drive hire or chauffeur-driven road trips to **${missingDestName}**:\n\n`;
      inv.availableVehicles.slice(0, 3).forEach((v) => {
        text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
      });
      text += `\nYou can book any of these vehicles and travel to **${missingDestName}** on your own schedule!`;

      return {
        text,
        alternatives: {
          type: 'VEHICLE',
          items: inv.availableVehicles.slice(0, 3).map((v) => ({
            id: v.id,
            type: 'VEHICLE',
            title: `${v.make} ${v.model}`,
            subtitle: `${v.seats} Seats · ${v.transmission} · ${v.fuelType}`,
            priceText: `KES ${v.pricePerDay.toLocaleString()} / day`,
            url: `/vehicles/${v.id}`,
            imageUrl: v.images?.[0],
          })),
        },
        action: {
          label: 'View Available Fleet',
          url: '/catalogue',
        },
      };
    }

    return {
      text: `${greetingLeadIn}We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our 24/7 concierge support desk.`,
      action: {
        label: 'Contact Concierge Desk',
        url: 'https://wa.me/254791888840',
      },
    };
  }

  // 9. GENERAL TRAVEL / ITINERARY PLANNING / PRICING QUESTIONS
  if (/\b(plan|itinerary|suggest|recommend|trip|travel|destination|safari|holiday|tour|cost|price|how\s+much|rates?|budget|help)\b/.test(q)) {
    if (inv.liveDestinations.length > 0) {
      let text = `${greetingLeadIn}I'd love to help you plan your journey! Here are the premier travel experiences **currently published in our system**:\n\n`;
      inv.liveDestinations.slice(0, 4).forEach((d) => {
        text += `• **${d.title}** (${d.location}) — KES ${d.priceKES.toLocaleString()} ${d.priceUnit || '/ person'}\n  ${d.subtitle || d.specs?.join(' · ') || ''}\n`;
      });
      text += `\nTell me which experience interests you, or how many days and travelers you have, and I will prepare a complete cost estimate!`;

      return {
        text,
        alternatives: {
          type: 'DESTINATION',
          items: inv.liveDestinations.slice(0, 4).map((d) => ({
            id: d.id,
            type: 'DESTINATION',
            title: d.title,
            subtitle: d.location,
            priceText: `KES ${d.priceKES.toLocaleString()} ${d.priceUnit || ''}`,
            url: '/holidays',
            imageUrl: d.imageUrl,
            badge: d.badge,
            specs: d.specs,
          })),
        },
        action: {
          label: 'Explore Active Destinations',
          url: '/holidays',
        },
      };
    }

    if (inv.availableVehicles.length > 0) {
      let text = `${greetingLeadIn}We currently have **${inv.availableVehicles.length} verified vehicle(s)** ready for immediate hire across Kenya:\n\n`;
      inv.availableVehicles.slice(0, 4).forEach((v) => {
        text += `• **${v.make} ${v.model}** (${v.year}) — **KES ${v.pricePerDay.toLocaleString()}/day** · ${v.seats} Seats\n`;
      });
      text += `\nClick **"View & Book"** on any vehicle below to pick your travel dates and reserve your ride, or ask me anything about a specific vehicle!`;

      return {
        text,
        alternatives: {
          type: 'VEHICLE',
          items: inv.availableVehicles.slice(0, 4).map((v) => ({
            id: v.id,
            type: 'VEHICLE',
            title: `${v.make} ${v.model}`,
            subtitle: `${v.seats} Seats · ${v.transmission} · ${v.fuelType}`,
            priceText: `KES ${v.pricePerDay.toLocaleString()} / day`,
            url: `/vehicles/${v.id}`,
            imageUrl: v.images?.[0],
          })),
        },
        action: { label: 'View Available Fleet', url: '/catalogue' },
      };
    }

    return {
      text: `${greetingLeadIn}We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our concierge support desk.`,
      action: {
        label: 'Contact Concierge Desk',
        url: 'https://wa.me/254791888840',
      },
    };
  }

  // 10. STRICT OUT-OF-SCOPE GUARDRAIL FOR UNRELATED QUESTIONS
  return {
    text:
      `I'm sorry, that question is outside the scope of the **M-TRAVEL** system, so I'm unable to answer it.\n\n` +
      `As an M-TRAVEL Concierge staff assistant, I can only help with questions related to our platform — such as:\n` +
      `• Checking available **vehicles, 4x4 SUVs, and charter buses**\n` +
      `• **How to book** a vehicle or holiday package step-by-step\n` +
      `• Daily **rental rates**, trip cost calculations, and **M-Pesa / Wallet** payments\n` +
      `• **Handover documents**, return inspections, or becoming a **Fleet Host**\n\n` +
      `Please try again with a question related to M-TRAVEL!`,
  };
}

// ─── Memoized Chat Input Component (Zero Keystroke Latency) ─────────────────

interface ChatInputBoxProps {
  onSend: (text: string) => void;
  isTyping: boolean;
}

const ChatInputBox = React.memo(function ChatInputBox({ onSend, isTyping }: ChatInputBoxProps) {
  const [inputText, setInputText] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;
    onSend(trimmed);
    setInputText('');
  };

  return (
    <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
      <input
        type="text"
        placeholder="Ask anything about travel, costs, vehicles, visas…"
        className="input-field !py-2.5 text-sm"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isTyping}
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!inputText.trim() || isTyping}
        className="btn-primary !p-2.5 rounded-xl shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title="Send"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
});

// ─── Elegant Message Formatting ───────────────────────────────────────────────

function renderInlineFormatting(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[\s\S]*?\*\*|\*[^\n*]+?\*|`[^`]+?`)/g);
  return tokens.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-700 font-normal">
          {inner}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-mono border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

interface StepItem {
  number: number;
  title: string;
  body: string;
}

type MessageBlock =
  | { type: 'numbered-steps'; steps: StepItem[] }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'status-pill'; text: string; variant: 'amber' | 'emerald' | 'slate' }
  | { type: 'question'; text: string }
  | { type: 'paragraph'; text: string };

function parseMessageBlocks(rawText: string): MessageBlock[] {
  const lines = rawText.split('\n');
  const blocks: MessageBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. Check for standalone status/badge notes like *(Currently on trip)* or *(All vehicles sanitized)*
    const statusMatch =
      line.match(/^\s*\*\((.*?)\)\*\s*$/) ||
      line.match(/^\s*\*(Currently [^*]+|Available [^*]+|Instant Confirmation[^*]*)\*\s*$/i);
    if (statusMatch) {
      const text = statusMatch[1].trim();
      const lower = text.toLowerCase();
      let variant: 'amber' | 'emerald' | 'slate' = 'slate';
      if (
        lower.includes('trip') ||
        lower.includes('busy') ||
        lower.includes('maintenance') ||
        lower.includes('awaiting')
      ) {
        variant = 'amber';
      } else if (
        lower.includes('available') ||
        lower.includes('ready') ||
        lower.includes('instant') ||
        lower.includes('verified')
      ) {
        variant = 'emerald';
      }
      blocks.push({ type: 'status-pill', text, variant });
      i++;
      continue;
    }

    // 2. Check for numbered steps (e.g. "1. **Open the Booking Page**:" or "1. Step...")
    const stepMatch = line.match(/^(\d+)[\.\)]\s*(.*)$/);
    if (stepMatch) {
      const steps: StepItem[] = [];

      while (i < lines.length) {
        // Skip occasional empty lines between numbered steps
        if (!lines[i].trim()) {
          let peekIdx = i + 1;
          while (peekIdx < lines.length && !lines[peekIdx].trim()) peekIdx++;
          if (peekIdx < lines.length && /^(\d+)[\.\)]\s*/.test(lines[peekIdx].trim())) {
            i = peekIdx;
          } else {
            break;
          }
        }

        const curLine = lines[i].trim();
        const curStepMatch = curLine.match(/^(\d+)[\.\)]\s*(.*)$/);
        if (!curStepMatch) break;

        const num = parseInt(curStepMatch[1], 10);
        const remainder = curStepMatch[2].trim();

        let title = '';
        let body = '';

        // Case A: 1. **Title**: Description on same line
        const boldWithColon = remainder.match(/^\*\*(.*?)\*\*[:\-]?\s*(.*)$/);
        if (boldWithColon) {
          title = boldWithColon[1].replace(/[:\-]$/, '').trim();
          body = boldWithColon[2].trim();
        } else {
          // Case B: 1. Title: Description on same line
          const colonIdx = remainder.indexOf(':');
          if (colonIdx > 0 && colonIdx < 50) {
            title = remainder.slice(0, colonIdx).replace(/^\*\*|\*\*$/g, '').trim();
            body = remainder.slice(colonIdx + 1).trim();
          } else {
            // Case C: Just title
            title = remainder.replace(/^\*\*|\*\*$/g, '').trim();
          }
        }

        // If body was not on the same line, check if the subsequent line is the body
        if (!body && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (
            nextLine &&
            !/^(\d+)[\.\)]/.test(nextLine) &&
            !/^[\•\-\*]\s/.test(nextLine) &&
            !/^\s*\*\([^*]+\)\*\s*$/.test(nextLine)
          ) {
            body = nextLine;
            i++; // consumed the body line
          }
        }

        steps.push({ number: num, title, body });
        i++;
      }

      if (steps.length > 0) {
        blocks.push({ type: 'numbered-steps', steps });
      }
      continue;
    }

    // 3. Check for bullet list item (• or - or * followed by space, but not ** bold)
    if (/^[\•\-\*]\s+(.*)$/.test(line) && !line.startsWith('**')) {
      const items: string[] = [];
      while (i < lines.length) {
        const curLine = lines[i].trim();
        if (!curLine) break;
        const bMatch = curLine.match(/^[\•\-\*]\s+(.*)$/);
        if (bMatch && !curLine.startsWith('**')) {
          items.push(bMatch[1].trim());
          i++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({ type: 'bullet-list', items });
      }
      continue;
    }

    // 4. Check if this is a closing interactive question (e.g. "Would you like me to...")
    if (
      line.endsWith('?') &&
      (line.length < 180 || i >= lines.length - 2) &&
      /^(would you|can i|shall i|should we|do you|how would you|are you interested|let me know)/i.test(line)
    ) {
      blocks.push({ type: 'question', text: line });
      i++;
      continue;
    }

    // 5. Standard paragraph - collect multi-line text until blank line or special line
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const curLine = lines[i].trim();
      if (!curLine) break;
      if (
        /^(\d+)[\.\)]\s/.test(curLine) ||
        (/^[\•\-\*]\s/.test(curLine) && !curLine.startsWith('**')) ||
        /^\s*\*\([^*]+\)\*\s*$/.test(curLine)
      ) {
        break;
      }
      paraLines.push(curLine);
      i++;
    }

    const paraText = paraLines.join(' ');
    // Double check if the single paragraph is actually a question prompt
    if (
      paraText.endsWith('?') &&
      paraLines.length <= 2 &&
      /^(would you|can i|shall i|should we|do you|how would you|are you interested|let me know)/i.test(paraText)
    ) {
      blocks.push({ type: 'question', text: paraText });
    } else {
      blocks.push({ type: 'paragraph', text: paraText });
    }
  }

  return blocks;
}

export function FormattedAiMessage({ text }: { text: string }) {
  const blocks = useMemo(() => parseMessageBlocks(text), [text]);

  return (
    <div className="space-y-3 text-slate-800">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'numbered-steps':
            return (
              <div key={idx} className="space-y-2 my-2.5">
                {block.steps.map((st) => (
                  <div
                    key={st.number}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white font-bold text-[11px] shadow-xs mt-0.5 font-mono">
                      {st.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      {st.title && (
                        <div className="text-xs font-bold text-slate-900 tracking-tight">
                          {renderInlineFormatting(st.title)}
                        </div>
                      )}
                      {st.body && (
                        <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {renderInlineFormatting(st.body)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'bullet-list':
            return (
              <div key={idx} className="space-y-1.5 my-1.5 pl-1">
                {block.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <span className="flex-1 min-w-0">{renderInlineFormatting(item)}</span>
                  </div>
                ))}
              </div>
            );

          case 'status-pill':
            return (
              <div key={idx} className="my-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs border ${
                    block.variant === 'amber'
                      ? 'bg-amber-500/10 text-amber-900 border-amber-300/80'
                      : block.variant === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-900 border-emerald-300/80'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      block.variant === 'amber'
                        ? 'bg-amber-500 animate-pulse'
                        : block.variant === 'emerald'
                        ? 'bg-emerald-500'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>{block.text}</span>
                </span>
              </div>
            );

          case 'question':
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 text-slate-900 text-xs sm:text-sm font-medium leading-relaxed my-2"
              >
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="flex-1">{renderInlineFormatting(block.text)}</span>
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p
                key={idx}
                className="text-xs sm:text-sm leading-relaxed text-slate-800 tracking-normal"
              >
                {renderInlineFormatting(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AiTravelAssistant({
  isModal = false,
  onClose,
  showCalculator = false,
  initialPrompt,
}: {
  isModal?: boolean;
  onClose?: () => void;
  showCalculator?: boolean;
  initialPrompt?: string;
}) {
  const navigate = useNavigate();

  // Real-time dynamic inventory state
  const [inventory, setInventory] = useState<SystemInventory>(getLiveSystemInventory());

  // Listen to real-time events to auto-update whenever items are added or removed (debounced)
  useEffect(() => {
    let timer: any = null;
    const handleUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setInventory(getLiveSystemInventory());
      }, 150);
    };

    window.addEventListener('mt_destinations_updated', handleUpdate);
    window.addEventListener('mt_vehicle_updated', handleUpdate);
    window.addEventListener('mt_booking_updated', handleUpdate);
    window.addEventListener('mt_remote_change', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('mt_destinations_updated', handleUpdate);
      window.removeEventListener('mt_vehicle_updated', handleUpdate);
      window.removeEventListener('mt_booking_updated', handleUpdate);
      window.removeEventListener('mt_remote_change', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: getDynamicGreeting(getLiveSystemInventory()),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [isTyping, setIsTyping] = useState(false);

  const handleActionNavigate = useCallback(
    (url: string) => {
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (isModal && onClose) {
        onClose();
      }
      navigate(url);
    },
    [isModal, onClose, navigate]
  );

  // Calculator state
  const [selectedDestId, setSelectedDestId] = useState<string>(
    inventory.liveDestinations[0]?.id || ''
  );
  const [calcDays, setCalcDays] = useState(3);
  const [calcPassengers, setCalcPassengers] = useState(4);
  const [calcVehicleType, setCalcVehicleType] = useState('SUV');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Auto-align selected destination if inventory changes
  useEffect(() => {
    if (inventory.liveDestinations.length > 0) {
      if (!selectedDestId || !inventory.liveDestinations.some((d) => d.id === selectedDestId)) {
        setSelectedDestId(inventory.liveDestinations[0].id);
      }
    } else {
      setSelectedDestId('');
    }
  }, [inventory.liveDestinations, selectedDestId]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const currentDestination = useMemo(() => {
    return (
      inventory.liveDestinations.find((d) => d.id === selectedDestId) ||
      inventory.liveDestinations[0] ||
      null
    );
  }, [inventory.liveDestinations, selectedDestId]);

  const handleSend = useCallback((textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messagesRef.current, userMsg];
    messagesRef.current = updatedHistory;
    setMessages(updatedHistory);
    setIsTyping(true);

    setTimeout(() => {
      // Read the most up-to-date real-time inventory & conversation history
      const freshInventory = getLiveSystemInventory();
      const { text: aiText, dest, vehicle, cost, action, alternatives } = buildLiveAiResponse(
        text,
        freshInventory,
        messagesRef.current
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        destinationData: dest,
        vehicleData: vehicle,
        costEstimate: cost,
        suggestedAction: action,
        alternatives,
      };

      setMessages((prev) => {
        const next = [...prev, aiMsg];
        messagesRef.current = next;
        return next;
      });
      setIsTyping(false);
    }, 550);
  }, []);

  const handledInitialPrompt = useRef<string | null>(null);
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && handledInitialPrompt.current !== initialPrompt) {
      handledInitialPrompt.current = initialPrompt;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend]);

  // Dynamic preset prompts derived from LIVE inventory & conversation context
  const presetPrompts = useMemo(() => {
    const list: Array<{ text: string; icon: any }> = [];
    const hasRecentVehicle = [...messages].reverse().some((m) => m.sender === 'ai' && m.vehicleData);

    if (hasRecentVehicle) {
      list.push({
        text: 'How can I book it?',
        icon: Car,
      });
      list.push({
        text: 'What documents do I need at pickup?',
        icon: Compass,
      });
    }

    if (inventory.liveDestinations.length > 0) {
      list.push({
        text: `Plan a trip to ${inventory.liveDestinations[0].title}`,
        icon: Compass,
      });
      if (inventory.liveDestinations.length > 1) {
        list.push({
          text: `Tell me about ${inventory.liveDestinations[1].title}`,
          icon: Palmtree,
        });
      }
    }

    if (inventory.availableVehicles.length > 0) {
      list.push({
        text: `Is the ${inventory.availableVehicles[0].make} ${inventory.availableVehicles[0].model} available?`,
        icon: Car,
      });
    } else if (inventory.onTripVehicles.length > 0) {
      list.push({
        text: `When will vehicles currently on trip return?`,
        icon: Clock,
      });
    }

    list.push({
      text: `How does direct M-Pesa payment work?`,
      icon: CreditCard,
    });

    if (inventory.isEmpty) {
      list.unshift({
        text: `Are any tours or vehicles available right now?`,
        icon: Bot,
      });
    }

    return list;
  }, [inventory, messages]);

  // Calculator computation
  const calculatedResult = useMemo(() => {
    if (!currentDestination) {
      const dailyRate =
        calcVehicleType === 'BUS' ? 25000 : calcVehicleType === 'SUV' ? 15000 : 10000;
      const vehicleTotal = dailyRate * calcDays;
      const estimatedFuel = calcDays * 3000;
      const totalKes = vehicleTotal + estimatedFuel;
      return {
        dailyRate,
        vehicleTotal,
        fuelEst: estimatedFuel,
        parkFees: 0,
        driverAllowance: calcDays * 2000,
        totalKes: totalKes + calcDays * 2000,
        totalUsd: Math.round((totalKes + calcDays * 2000) / 130),
      };
    }

    const dailyRate =
      calcVehicleType === 'BUS' ? 25000 : calcVehicleType === 'SUV' ? 15000 : 10000;
    const vehicleTotal = dailyRate * calcDays;
    const destPriceTotal = (currentDestination.priceKES || 50000) * calcPassengers;
    const fuelEst = calcDays * 3500;
    const driverAllowance = calcDays * (calcVehicleType === 'BUS' ? 2500 : 2000);
    const totalKes = vehicleTotal + destPriceTotal + fuelEst + driverAllowance;

    return {
      dailyRate,
      vehicleTotal,
      fuelEst,
      parkFees: destPriceTotal,
      driverAllowance,
      totalKes,
      totalUsd: Math.round(totalKes / 130),
    };
  }, [currentDestination, calcDays, calcPassengers, calcVehicleType]);

  return (
    <div
      className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${
        isModal ? 'h-[85vh] max-w-4xl w-full mx-auto' : 'h-[750px] w-full'
      }`}
    >
      {/* HEADER */}
      <div className="bg-slate-50/90 p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm border border-slate-800">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                inventory.isEmpty ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              M-TRAVEL AI Travel Concierge
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-mono font-bold border ${
                  inventory.isEmpty
                    ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                }`}
              >
                {inventory.isEmpty ? 'Standby' : 'Live Sync'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {inventory.isEmpty
                ? 'System updated in real time · No active listings currently published'
                : `Live Inventory: ${inventory.liveDestinations.length} destination(s) · ${inventory.availableVehicles.length} available vehicle(s)`}
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="btn-ghost !px-3 !py-1.5 text-xs cursor-pointer">
            Close
          </button>
        )}
      </div>

      {/* BODY */}
      <div
        className={`flex-1 grid grid-cols-1 ${
          showCalculator ? 'lg:grid-cols-12' : ''
        } overflow-hidden min-h-0`}
      >
        {/* CHAT PANEL */}
        <div
          className={`${
            showCalculator ? 'lg:col-span-7 border-r' : 'w-full'
          } flex flex-col border-slate-200 bg-slate-50/40 overflow-hidden`}
        >
          {/* MESSAGES */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 ${
                    msg.sender === 'user'
                      ? 'bg-slate-950 text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none space-y-3 shadow-sm'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <FormattedAiMessage text={msg.text} />
                  )}

                  {/* DESTINATION CARD */}
                  {msg.destinationData && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden space-y-3 p-3 shadow-sm">
                      <div className="relative h-40 rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={msg.destinationData.imageUrl}
                          alt={msg.destinationData.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-2 rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm border border-white/20">
                          {msg.destinationData.category || 'DESTINATION'}
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 uppercase shadow-sm font-mono">
                          KES {msg.destinationData.priceKES.toLocaleString()}{' '}
                          {msg.destinationData.priceUnit || ''}
                        </span>
                      </div>

                      {/* MULTI PHOTO GALLERY */}
                      {Array.isArray(msg.destinationData.images) &&
                        msg.destinationData.images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {msg.destinationData.images.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt=""
                                className="h-14 w-22 rounded-md object-cover border border-slate-200 shrink-0"
                              />
                            ))}
                          </div>
                        )}

                      <div className="font-bold text-sm text-slate-900">
                        {msg.destinationData.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3 text-slate-600" />
                        <span>{msg.destinationData.location}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {msg.destinationData.details?.overview || msg.destinationData.subtitle}
                      </p>

                      {/* HIGHLIGHTS */}
                      {msg.destinationData.details?.highlights &&
                        msg.destinationData.details.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {msg.destinationData.details.highlights.slice(0, 4).map((h, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium"
                              >
                                ✓ {h}
                              </span>
                            ))}
                          </div>
                        )}

                      {/* COST ESTIMATE */}
                      {msg.costEstimate && (
                        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-950 font-semibold">
                            <span>
                              Trip Estimate — {msg.costEstimate.days} days,{' '}
                              {msg.costEstimate.passengers} pax
                            </span>
                            <span className="font-mono font-bold">
                              KES {msg.costEstimate.totalKes.toLocaleString()} / $
                              {msg.costEstimate.totalUsd}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-slate-600 pt-1 border-t border-slate-200">
                            <div>
                              Vehicle ({msg.costEstimate.vehicleType}):{' '}
                              KES {msg.costEstimate.vehicleTotalKes.toLocaleString()}
                            </div>
                            <div>
                              Fuel estimate: KES {msg.costEstimate.estimatedFuelKes.toLocaleString()}
                            </div>
                            <div>
                              Tours/Fees: KES {msg.costEstimate.parkFeesKes.toLocaleString()}
                            </div>
                            <div>
                              Driver allowance: KES{' '}
                              {msg.costEstimate.driverAllowanceKes.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ACTION BUTTON */}
                      {msg.suggestedAction && (
                        <button
                          onClick={() => handleActionNavigate(msg.suggestedAction!.url)}
                          className="btn-primary w-full text-xs !py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Compass className="h-4 w-4" /> {msg.suggestedAction.label}
                        </button>
                      )}
                    </div>
                  )}

                  {/* VEHICLE CARD */}
                  {msg.vehicleData && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden space-y-3 p-3 shadow-sm">
                      <div className="relative h-40 rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={msg.vehicleData.images?.[0] || getVehicleFallbackImage(msg.vehicleData.make, msg.vehicleData.model, msg.vehicleData.type, msg.vehicleData.id)}
                          alt={`${msg.vehicleData.make} ${msg.vehicleData.model}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm border border-white/20">
                          {msg.vehicleData.seats} Seats
                        </span>
                        <span className="absolute bottom-2 right-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-slate-950 uppercase shadow-sm font-mono">
                          KES {msg.vehicleData.pricePerDay.toLocaleString()} / day
                        </span>
                      </div>

                      <div className="font-bold text-sm text-slate-900">
                        {msg.vehicleData.make} {msg.vehicleData.model} ({msg.vehicleData.year})
                      </div>
                      <div className="text-xs text-slate-600 grid grid-cols-2 gap-1.5 font-medium">
                        <div>👥 {msg.vehicleData.seats} Passengers</div>
                        <div>⚙️ {msg.vehicleData.transmission}</div>
                        <div>⛽ {msg.vehicleData.fuelType}</div>
                        <div>📍 {msg.vehicleData.address || 'Nairobi, Kenya'}</div>
                      </div>

                      {msg.suggestedAction && (
                        <button
                          onClick={() => handleActionNavigate(msg.suggestedAction!.url)}
                          className="btn-primary w-full text-xs !py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Car className="h-4 w-4" /> {msg.suggestedAction.label}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ALTERNATIVES CARDS (When requested item was removed or is not available) */}
                  {msg.alternatives && msg.alternatives.items.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Available Alternatives Currently in System:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.alternatives.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-400 transition shadow-2xs flex flex-col justify-between"
                          >
                            <div>
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="h-20 w-full object-cover rounded-lg mb-2 border border-slate-200"
                                />
                              )}
                              <div className="font-bold text-xs text-slate-900 line-clamp-1">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {item.subtitle}
                              </div>
                              <div className="text-xs font-bold text-slate-900 font-mono mt-1.5">
                                {item.priceText}
                              </div>
                            </div>
                            <button
                              onClick={() => handleActionNavigate(item.url)}
                              className="mt-2.5 w-full rounded-lg bg-slate-950 text-white text-[11px] font-semibold py-1.5 hover:bg-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>View &amp; Book</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STANDALONE ACTION */}
                  {!msg.destinationData && !msg.vehicleData && msg.suggestedAction && (
                    <div className="pt-1">
                      <button
                        onClick={() => handleActionNavigate(msg.suggestedAction!.url)}
                        className="btn-primary w-full text-xs !py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="h-4 w-4" /> {msg.suggestedAction.label}
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-700 p-3 bg-slate-100 rounded-xl max-w-xs border border-slate-200">
                <Sparkles className="h-4 w-4 animate-spin text-slate-800" /> Checking live system
                inventory…
              </div>
            )}
          </div>

          {/* DYNAMIC PRESET CHIPS */}
          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex gap-2 overflow-x-auto shrink-0 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {presetPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.text)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:text-slate-950 hover:border-slate-900 hover:bg-slate-100 transition font-semibold shadow-2xs cursor-pointer"
              >
                <item.icon className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                {item.text}
              </button>
            ))}
          </div>

          {/* ISOLATED MEMOIZED INPUT COMPONENT (ZERO TYPING LATENCY) */}
          <ChatInputBox onSend={handleSend} isTyping={isTyping} />
        </div>

        {/* CALCULATOR PANEL */}
        {showCalculator && (
          <div className="lg:col-span-5 p-4 flex flex-col space-y-4 bg-slate-50/70 border-l border-slate-200 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <h4 className="font-display font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
                <Calculator className="h-4 w-4 text-slate-800" /> Trip Cost Calculator
              </h4>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">
                {inventory.liveDestinations.length > 0 ? 'Live Catalog Sync' : 'Fleet Mode'}
              </span>
            </div>

            {inventory.liveDestinations.length > 0 ? (
              <>
                <div>
                  <label className="block text-xs text-slate-700 font-semibold mb-1">
                    Active Destination
                  </label>
                  <select
                    className="input-field text-sm"
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                  >
                    {inventory.liveDestinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-700 font-semibold mb-1">
                      Days
                    </label>
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
                    <label className="block text-[10px] text-slate-700 font-semibold mb-1">
                      Passengers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={calcVehicleType === 'BUS' ? 55 : 15}
                      className="input-field text-sm !px-2 !py-2"
                      value={calcPassengers}
                      onChange={(e) => setCalcPassengers(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-700 font-semibold mb-1">
                      Vehicle Type
                    </label>
                    <select
                      className="input-field text-xs !px-1 !py-2"
                      value={calcVehicleType}
                      onChange={(e) => setCalcVehicleType(e.target.value)}
                    >
                      <option value="SUV">4x4 SUV</option>
                      <option value="VAN">Safari Van</option>
                      <option value="BUS">Bus / Coach</option>
                      <option value="CAR">Sedan</option>
                    </select>
                  </div>
                </div>

                {/* DESTINATION PREVIEW */}
                {currentDestination && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden relative group shadow-sm bg-slate-100">
                    <img
                      src={currentDestination.imageUrl}
                      alt={currentDestination.title}
                      className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <h5 className="font-display font-semibold text-sm text-white">
                        {currentDestination.title}
                      </h5>
                      <p className="text-[10px] text-slate-200">{currentDestination.location}</p>
                    </div>
                  </div>
                )}

                {/* COST BREAKDOWN */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-600 font-medium">Estimated Total</span>
                    <div className="text-right">
                      <span className="font-mono text-xl font-bold text-slate-950">
                        KES {calculatedResult.totalKes.toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        ≈ ${calculatedResult.totalUsd} USD
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>
                        Vehicle hire ({calcDays}d ×{' '}
                        {calculatedResult.dailyRate.toLocaleString()}):
                      </span>
                      <span className="font-mono font-semibold">
                        KES {calculatedResult.vehicleTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Package estimate ({calcPassengers} pax):</span>
                      <span className="font-mono font-semibold">
                        KES {calculatedResult.parkFees.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fuel &amp; logistics:</span>
                      <span className="font-mono font-semibold">
                        KES {calculatedResult.fuelEst.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Driver allowance:</span>
                      <span className="font-mono font-semibold">
                        KES {calculatedResult.driverAllowance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/holidays')}
                    className="btn-primary w-full text-xs !py-2.5 font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="h-4 w-4" />
                    <span>View &amp; Book Tour</span>
                  </button>
                </div>
              </>
            ) : inventory.availableVehicles.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Car className="h-4 w-4 text-slate-950" />
                  <span>Fleet Vehicle Hire Estimator</span>
                </div>
                <p className="text-slate-600">
                  No packaged tours are published currently, but you can estimate self-drive vehicle hire across our active fleet.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="block text-[10px] text-slate-700 font-semibold mb-1">
                      Days of Hire
                    </label>
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
                    <label className="block text-[10px] text-slate-700 font-semibold mb-1">
                      Vehicle Type
                    </label>
                    <select
                      className="input-field text-xs !px-1 !py-2"
                      value={calcVehicleType}
                      onChange={(e) => setCalcVehicleType(e.target.value)}
                    >
                      <option value="SUV">4x4 SUV</option>
                      <option value="VAN">Safari Van</option>
                      <option value="BUS">Bus / Coach</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Vehicle Total ({calcDays} days):</span>
                  <span className="font-mono font-bold text-slate-950 text-sm">
                    KES {(calculatedResult.dailyRate * calcDays).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => navigate('/catalogue')}
                  className="btn-primary w-full text-xs !py-2.5 font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <Car className="h-4 w-4" />
                  <span>Browse Fleet Catalogue</span>
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 space-y-2 text-center text-xs text-slate-600">
                <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto" />
                <div className="font-bold text-slate-900">No Listings in Catalogue</div>
                <p>
                  There are currently no active vehicles or destinations published in the system. Check back later or add items via Admin Dashboard.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
