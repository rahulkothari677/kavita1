# Kavita's Artistry: plan to become the best app for buying handmade art

Written 21 Oct 2026, after the six-phase upgrade (speed, logo, splash, motion, bottom dock, themes).
Each idea says **why it matters**, **what we build** and **how big it is** (S = a day, M = a few days,
L = a week or more). Ideas are ordered by how much they help a customer decide to buy.

The honest starting point: the app now looks and moves like a premium app. What it does not yet
have is real products, real photos of Kavita's own work and real customer reviews. No design
change beats those. **Step 0 below matters more than everything else on this page.**

---

## Step 0: real work, real photos (owner, this week)
- Replace the demo pieces with Kavita's real pieces using Admin → Products → Snap & Sell.
- For each piece, take three photos: the full piece in daylight, a close-up of the mirrors or
  detail, and the piece on a wall with something for scale (a switchboard, a plant, a hand).
- Ask the first 5–10 buyers for a review with a photo. The site never shows made-up reviews,
  so these are the first real ones.

## 1. Help people picture it on their wall (biggest reason people hesitate)
| Idea | What we build | Size |
|---|---|---|
| **See it on your wall** | On a product page, "Try on my wall" opens the phone camera or a photo of the customer's room. The piece appears at its real size (we already store sizes), and they can drag and pinch it into place, then share the picture on WhatsApp. | L |
| **Size guide with objects** | Next to each size, show a simple drawing of the piece next to a door, a sofa or an A4 sheet, drawn to scale. | S |
| **360° / tilt shimmer** | Mirror work comes alive when it moves. Use a short 3-second video loop or a "tilt your phone" effect that moves a light sweep across the mirrors. | M |

## 2. Make every piece feel personal
| Idea | What we build | Size |
|---|---|---|
| **The story of this piece** | A short "made for you" section on each product: how long it took, which mirrors and colours, one line from Kavita. Admin gets a field for it, and AI can draft it from the photos. | S |
| **Order journey with photos** | The order page already has a timeline. Kavita adds a photo at each stage (sketch → clay → mirrors → packed), and the customer gets a WhatsApp note with the photo. People love watching their piece being made, and they share it. | M |
| **Name and colour personaliser** | For name plates and customisable pieces, a live preview where the customer types the name and picks colours before ordering. | M |
| **Gift mode** | A gift-wrap preview, a handwritten-style card message and a "send the surprise date" option. The order message to Kavita says it is a gift. | S |

## 3. Shop the way people think
| Idea | What we build | Size |
|---|---|---|
| **Shop by room** | Living room, pooja room, entrance, kids' room, office: each with a photo of a real wall and the pieces that suit it. | S |
| **Shop by occasion** | Diwali, housewarming, wedding, Raksha Bandhan, return gifts. The home page swaps in the right occasion automatically by date. | S |
| **Shop by budget** | Under ₹500 / ₹1,000 / ₹2,000 chips on the home page and in the gift finder. | S |
| **Smarter Kavi (AI helper)** | Kavi can already recommend pieces. Next: send a photo of a wall and Kavi suggests pieces and sizes, and "make this in blue" turns into a custom-order request. | M |

## 4. Feel like a real app on the phone
| Idea | What we build | Size |
|---|---|---|
| **Order and restock alerts** | With the installed app, opt-in alerts: "Your piece is ready", "The sold-out mandala is back". | M |
| **Swipe gestures** | Swipe between photos (already), swipe a bag item to remove it, pull down to refresh the shop. | S |
| **Haptic taps** | A tiny vibration on add-to-bag and wishlist on Android. | S |
| **Offline wishlist and bag** | Already kept on the phone; add a "you are offline, your bag is safe" note. | S |
| **Dark mode follows the phone** | If the phone is in dark mode, show the Midnight theme automatically (owner can switch this off). | S |

## 5. Trust, without fake social proof
| Idea | What we build | Size |
|---|---|---|
| **Meet the maker** | A 20-second video of Kavita at work on the About page and the home page. | S (once the video exists) |
| **Real photo reviews** | Reviews with customers' photos of the piece on their wall, shown first. | S |
| **Clear promises** | Delivery time by pin code, how breakage is handled, how custom orders are confirmed: short, plain and visible on every product page. | S |
| **Instagram wall** | Kavita's latest posts in a strip on the home page (only real posts). | S |

## 6. Make the owner's life easier (so the shop can grow)
| Idea | What we build | Size |
|---|---|---|
| **One-tap festive mode** | One switch in admin turns on the Festive theme, a Diwali banner and the occasion collection, and turns them off after the date. | S |
| **Photo studio in Snap & Sell** | Automatic background clean-up and a "place on a wall" mock-up photo for every new product. | M |
| **Weekly summary on WhatsApp** | Orders, top viewed pieces and pieces running low, sent to the owner every Monday. | S |

## 7. Speed and quality (keep it fast as it grows)
- **Move to Mumbai** (see HANDOFF.md). The shop and filter pages would answer about 0.2 s faster in India.
- Keep every new page prerendered like the home and product pages are now.
- The "Live site check" runs after every deploy. Add a speed budget so a slow change gets flagged.
- Test on a cheap Android phone every month: that is what most customers use.

---

## Suggested order
1. **Now:** Step 0 (real products and photos), shop by room/occasion/budget, the story of each piece.
2. **Next month:** order journey with photos, gift mode, personaliser, festive mode.
3. **After that:** "see it on your wall", tilt shimmer, alerts, smarter Kavi.

How we will know it is working: more people who open a product go on to message on WhatsApp,
more repeat buyers, and more photo reviews. The admin dashboard already counts product views and
WhatsApp clicks, so we can compare before and after each step.
