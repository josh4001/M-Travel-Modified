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

function getDynamicGreeting(inv: SystemInventory): string {
  if (inv.isEmpty) {
    return "Jambo! I'm your M-TRAVEL AI Concierge. We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our 24/7 Concierge Support Desk for upcoming schedule releases.";
  }
  if (inv.liveDestinations.length > 0 && inv.availableVehicles.length > 0) {
    return `Jambo! I'm your M-TRAVEL AI Concierge — your real-time guide to travel planning and vehicle hire. We currently have **${inv.liveDestinations.length} active destination(s)** and **${inv.availableVehicles.length} verified vehicle(s)** ready in our live system. Ask me about available tours, fleet pricing, route estimates, or trip advice!`;
  }
  if (inv.liveDestinations.length > 0) {
    return `Jambo! I'm your M-TRAVEL AI Concierge. We currently have **${inv.liveDestinations.length} active travel experience(s)** published in our live system. Ask me about any available trip, pricing, or itineraries!`;
  }
  return `Jambo! I'm your M-TRAVEL AI Concierge. We currently have **${inv.availableVehicles.length} verified vehicle(s)** ready for hire in our active fleet. Ask me about vehicle specs, daily rates, or road trip recommendations!`;
}

// ─── Real-Time AI Response Engine ──────────────────────────────────────────────

function buildLiveAiResponse(
  query: string,
  inv: SystemInventory
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

  // 1. GREETING DETECTION
  if (/\b(hi|hello|hey|jambo|habari|hujambo|good morning|good evening|sup|what's up)\b/.test(q)) {
    return { text: getDynamicGreeting(inv) };
  }

  // 2. CHECK IF SYSTEM IS COMPLETELY EMPTY
  if (inv.isEmpty) {
    // If it's a procedural question (payment, visa, packing, etc.), answer helpfully with empty note
    if (/mpesa|payment|pay|card|wallet/.test(q)) {
      return {
        text: `${PROCEDURAL_KNOWLEDGE.mpesa}\n\n*(Note: Our marketplace catalogue currently does not have active vehicles or destinations available at the moment. Please try again later.)*`,
      };
    }
    if (/visa|entry|passport|permit/.test(q)) {
      return {
        text: `${PROCEDURAL_KNOWLEDGE.visaKenya}\n\n*(Note: We currently do not have active vehicles or destinations available in our system at the moment. Please try again later.)*`,
      };
    }
    if (/pack|luggage|gear|clothing/.test(q)) {
      return { text: PROCEDURAL_KNOWLEDGE.packingList };
    }
    if (/malaria|health|vaccine/.test(q)) {
      return { text: PROCEDURAL_KNOWLEDGE.malaria };
    }

    // For all destinations, vehicles, bookings, costs, or trip questions:
    return {
      text: "We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our 24/7 Concierge Support Desk for upcoming schedule releases.",
      action: {
        label: "Contact Concierge Desk",
        url: "https://wa.me/254791888840?text=Hello%20M-Travel,%20I%20would%20like%20to%20inquire%20about%20upcoming%20destinations%20and%20fleet%20availability",
      },
    };
  }

  // 3. PROCEDURAL GENERAL QUESTIONS
  if (/m.?travel|about us|who are you|your company|your platform/.test(q)) {
    return {
      text: `${PROCEDURAL_KNOWLEDGE.mtravel}\n\n**Current Live System Status**:\n• Verified Active Vehicles: **${inv.availableVehicles.length} available**${inv.onTripVehicles.length > 0 ? ` (${inv.onTripVehicles.length} on trip)` : ''}\n• Published Destinations / Tours: **${inv.liveDestinations.length} active**`,
      action: {
        label: inv.liveDestinations.length > 0 ? 'Browse Live Destinations' : 'View Fleet Catalogue',
        url: inv.liveDestinations.length > 0 ? '/holidays' : '/catalogue',
      },
    };
  }

  if (/mpesa|m-pesa|payment|pay|card|visa|mastercard|wallet/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.mpesa };
  }

  if (/visa|entry|passport|permit|immigration/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.visaKenya };
  }

  if (/pack|what to bring|luggage|clothes|kit|gear/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.packingList };
  }

  if (/malaria|health|vaccine|vaccination|medicine|mosquito/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.malaria };
  }

  if (/currency|money|exchange|shilling|kes|usd|forex/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.currency };
  }

  if (/safe|security|danger|crime|risk|is kenya safe/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.safety };
  }

  if (/sim|internet|wifi|data|network|safaricom|connectivity/.test(q)) {
    return { text: PROCEDURAL_KNOWLEDGE.connectivity };
  }

  // 4. CHECK SPECIFIC VEHICLE MENTIONS OR FLEET QUERIES
  const vehicleKeywords = [
    'vehicle', 'car', 'suv', 'van', 'prado', 'land cruiser', '4x4', 'pickup',
    'fleet', 'hire a car', 'rent a car', 'bus', 'coaster', 'coach', 'sedan',
    'toyota', 'isuzu', 'subaru', 'mercedes', 'vitz', 'harrier', 'rav4', 'minibus'
  ];
  const isVehicleQuery = vehicleKeywords.some((k) => q.includes(k));

  if (isVehicleQuery) {
    // Check if user specifically requested a particular model
    const requestedModel =
      q.includes('prado') ? 'Toyota Land Cruiser Prado' :
      q.includes('land cruiser') ? 'Toyota Land Cruiser' :
      q.includes('coach') || q.includes('bus') ? 'Tour Coach / Bus' :
      q.includes('van') || q.includes('minibus') ? 'Safari Minibus Van' :
      q.includes('rav4') ? 'Toyota RAV4' :
      q.includes('subaru') ? 'Subaru' :
      q.includes('sedan') ? 'Executive Sedan' :
      q.includes('pickup') ? '4x4 Pickup' : null;

    if (requestedModel) {
      // Find if this vehicle exists in the live fleet
      const matchedVehicle = inv.liveVehicles.find((v) => {
        const name = `${v.make} ${v.model} ${v.type}`.toLowerCase();
        return (
          (q.includes('prado') && name.includes('prado')) ||
          (q.includes('land cruiser') && name.includes('cruiser')) ||
          ((q.includes('bus') || q.includes('coach')) && (isBusVehicle(v) || name.includes('bus') || name.includes('coach'))) ||
          (q.includes('van') && (v.type === 'VAN' || name.includes('van') || name.includes('minibus'))) ||
          (q.includes('rav4') && name.includes('rav4')) ||
          (q.includes('pickup') && (v.type === 'PICKUP' || name.includes('pickup')))
        );
      });

      if (matchedVehicle) {
        const hireStatus = getVehicleHireStatus(matchedVehicle.id);

        if (hireStatus.isOnTrip) {
          // Vehicle is currently out on a trip
          let text = `The **${matchedVehicle.make} ${matchedVehicle.model}** is **currently on an active trip with a traveler**${
            hireStatus.returnDate ? ` until ${hireStatus.returnDate}` : ''
          }. Booking and payment are disabled until the vehicle returns and inspection is completed by Admin.\n\n`;

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
                  url: isBusVehicle(v) ? '/catalogue?category=buses' : `/vehicles/${v.id}`,
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
            text += `There are currently no other vehicles available in the fleet. Please check back later once this vehicle completes its trip.`;
            return { text };
          }
        }

        if (hireStatus.isAwaitingHandover) {
          let text = `The **${matchedVehicle.make} ${matchedVehicle.model}** is **reserved and scheduled for departure**.\n\n`;
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
                  url: isBusVehicle(v) ? '/catalogue?category=buses' : `/vehicles/${v.id}`,
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
          text: `The **${matchedVehicle.make} ${matchedVehicle.model} (${matchedVehicle.year})** is **currently available for hire** in our fleet!\n\n• **Daily Rate**: KES ${matchedVehicle.pricePerDay.toLocaleString()}/day\n• **Capacity**: ${matchedVehicle.seats} Passengers\n• **Transmission**: ${matchedVehicle.transmission} · **Fuel**: ${matchedVehicle.fuelType}\n• **Pickup Location**: ${matchedVehicle.address || 'Nairobi, Kenya'}\n• **Status**: Verified, commercially insured, and ready for immediate booking.`,
          vehicle: matchedVehicle,
          action: {
            label: `Book ${matchedVehicle.make} ${matchedVehicle.model}`,
            url: isBusVehicle(matchedVehicle) ? '/catalogue?category=buses' : `/vehicles/${matchedVehicle.id}`,
          },
        };
      }

      // The requested model is NOT in live fleet
      let text = `**"${requestedModel}"** is currently **not available in our fleet** as it has been unlisted or removed.\n\n`;
      if (inv.availableVehicles.length > 0) {
        text += `However, we currently have the following verified vehicle(s) **available in our active fleet**:\n\n`;
        inv.availableVehicles.slice(0, 3).forEach((v) => {
          text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
        });
        text += `\nWould you like to book one of these available options?`;
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
              url: isBusVehicle(v) ? '/catalogue?category=buses' : `/vehicles/${v.id}`,
              imageUrl: v.images?.[0],
            })),
          },
          action: { label: 'Explore Fleet Catalogue', url: '/catalogue' },
        };
      } else {
        text = "We currently do not have active vehicles available in our fleet at the moment. Please try again later.";
        return { text };
      }
    }

    // General vehicle fleet question ("What vehicles do you have?")
    if (inv.availableVehicles.length === 0 && inv.liveVehicles.length === 0) {
      return {
        text: "There are currently no vehicles available for hire in our fleet at the moment. Please try again later or check back soon as hosts add new vehicles.",
      };
    }

    let text = `Here are the vehicles **currently in our active fleet**:\n\n`;
    inv.liveVehicles.forEach((v) => {
      const hire = getVehicleHireStatus(v.id);
      const statusText = hire.isOnTrip
        ? `⚠️ *(Currently on trip${hire.returnDate ? ` until ${hire.returnDate}` : ''})*`
        : hire.isAwaitingHandover
        ? `🔒 *(Booked · Awaiting departure)*`
        : `✅ *(Available for hire)*`;
      text += `• **${v.make} ${v.model} (${v.year})** — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats · ${statusText}\n`;
    });

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
            url: isBusVehicle(v) ? '/catalogue?category=buses' : `/vehicles/${v.id}`,
            imageUrl: v.images?.[0],
          })),
        },
        action: { label: 'View Fleet Catalogue', url: '/catalogue' },
      };
    }

    return { text };
  }

  // 5. DESTINATION MATCHING AGAINST CURRENT LIVE SYSTEM DATA
  // Check if query matches a destination CURRENTLY in the system
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

  // Scenario A: Destination IS currently published in the system!
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
      `Great choice! Here are the details for **${matchingLiveDest.title}** currently available in our system:\n\n` +
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

  // Scenario B: User asked about a specific destination that is NOT in the system
  // (e.g. they asked for Maasai Mara, Amboseli, Diani Beach, Naivasha, Mount Kenya, Tsavo, etc., but it was removed)
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
    let text = `**"${missingDestName}"** is currently **not available in our active catalogue** as it has been removed or is temporarily unlisted.\n\n`;

    // Suggest available destination alternatives
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

    // No destinations, but vehicles exist
    if (inv.availableVehicles.length > 0) {
      text += `Currently, there are no packaged tours published in our catalogue. However, we have **${inv.availableVehicles.length} verified vehicle(s)** ready for custom self-drive hire or road trips:\n\n`;
      inv.availableVehicles.slice(0, 3).forEach((v) => {
        text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
      });
      text += `\nYou can hire an available vehicle and travel to any destination across Kenya on your own schedule!`;

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
            url: '/catalogue',
            imageUrl: v.images?.[0],
          })),
        },
        action: {
          label: 'View Available Fleet',
          url: '/catalogue',
        },
      };
    }

    // Both 0
    return {
      text: "We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our 24/7 concierge support desk.",
      action: {
        label: "Contact Concierge Desk",
        url: "https://wa.me/254791888840",
      },
    };
  }

  // 6. GENERAL TRAVEL / ITINERARY PLANNING QUESTIONS ("Plan a trip", "Suggest a holiday", etc.)
  if (/plan|itinerary|suggest|recommend|where|trip|travel|destination|safari|holiday|tour/.test(q)) {
    if (inv.liveDestinations.length > 0) {
      let text = `I'd love to help you plan your journey! Here are the premier travel experiences **currently published in our system**:\n\n`;
      inv.liveDestinations.slice(0, 4).forEach((d) => {
        text += `• **${d.title}** (${d.location}) — KES ${d.priceKES.toLocaleString()} ${d.priceUnit || '/ person'}\n  ${d.subtitle || d.specs?.join(' · ') || ''}\n`;
      });
      text += `\nTell me which experience interests you, or how many days and travelers you have, and I will prepare a complete itinerary!`;

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
      let text = `We currently do not have pre-packaged tour packages in our catalogue, but we have **${inv.availableVehicles.length} verified vehicle(s)** ready for custom self-drive hire or guided road trips:\n\n`;
      inv.availableVehicles.slice(0, 3).forEach((v) => {
        text += `• **${v.make} ${v.model}** (${v.year}) — KES ${v.pricePerDay.toLocaleString()}/day · ${v.seats} Seats\n`;
      });
      text += `\nYou can hire a vehicle for your chosen number of days. Where would you like to travel?`;

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
            url: '/catalogue',
            imageUrl: v.images?.[0],
          })),
        },
        action: { label: 'View Available Fleet', url: '/catalogue' },
      };
    }

    return {
      text: "We currently do not have active vehicles or destinations available in our system at the moment. Please try again later or contact our concierge support desk.",
      action: {
        label: "Contact Concierge Desk",
        url: "https://wa.me/254791888840",
      },
    };
  }

  // 7. DEFAULT HELPFUL FALLBACK
  return {
    text: `I'm your real-time M-TRAVEL AI Concierge! I am synchronized with our live system (${inv.liveDestinations.length} active destination(s) and ${inv.availableVehicles.length} available vehicle(s)).\n\nYou can ask me:\n${
      inv.liveDestinations.length > 0
        ? `• "Tell me about ${inv.liveDestinations[0].title}"\n`
        : ''
    }${
      inv.availableVehicles.length > 0
        ? `• "Is the ${inv.availableVehicles[0].make} ${inv.availableVehicles[0].model} available?"\n`
        : ''
    }• "What vehicles are in our fleet?"\n• "How does direct M-Pesa payment work?"\n• "What should I pack for safari?"\n\nHow can I assist your journey?`,
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
  const [isTyping, setIsTyping] = useState(false);

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

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      // Read the most up-to-date real-time inventory
      const freshInventory = getLiveSystemInventory();
      const { text: aiText, dest, vehicle, cost, action, alternatives } = buildLiveAiResponse(
        text,
        freshInventory
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

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  }, []);

  const handledInitialPrompt = useRef<string | null>(null);
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && handledInitialPrompt.current !== initialPrompt) {
      handledInitialPrompt.current = initialPrompt;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend]);

  // Dynamic preset prompts derived from LIVE inventory
  const presetPrompts = useMemo(() => {
    const list: Array<{ text: string; icon: any }> = [];

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
  }, [inventory]);

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
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>

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
                          onClick={() => navigate(msg.suggestedAction!.url)}
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
                          onClick={() => navigate(msg.suggestedAction!.url)}
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
                              onClick={() => navigate(item.url)}
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
                        onClick={() => {
                          if (msg.suggestedAction!.url.startsWith('http')) {
                            window.open(msg.suggestedAction!.url, '_blank');
                          } else {
                            navigate(msg.suggestedAction!.url);
                          }
                        }}
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
          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
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
