import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const faqItems = [
    {
      id: "betting",
      category: "Betting System",
      question: "How do I place a bet?",
      answer: "To place a bet, select a team (Team A or Team B) and choose an amount from the available denominations (10, 50, or 100 Sweep Coins). Once you click the bet button, a confirmation dialog will appear. Confirm the bet, and it will be added to the betting queue. You can place multiple bets on the same team or alternate between teams."
    },
    {
      id: "denominations",
      category: "Betting System",
      question: "What are the available bet denominations?",
      answer: "You can bet in three denominations: 10 Sweep Coins, 50 Sweep Coins, or 100 Sweep Coins. These standard amounts provide flexibility for different betting preferences and strategies during the game."
    },
    {
      id: "booked",
      category: "Betting System",
      question: "What does 'Booked Bets' mean?",
      answer: "Booked Bets are bets that have been confirmed and matched with opposing bets. When you place a bet on Team A or Team B, it enters the betting queue. Once a matching bet of the same amount appears on the opposite team, both bets are automatically highlighted (booked) to show they've been paired together. This creates a balanced betting pair, and both bets are now locked in for that game round."
    },
    {
      id: "matching",
      category: "Betting System",
      question: "How does automatic bet matching work?",
      answer: "The betting system uses priority-based automatic matching. When you place a bet, it enters the betting queue and waits for a matching bet from the opposite team. The system matches bets in order: your bet will match with the FIRST available bet in line on the other team that has the same amount. For example, if Team A Queue has: [100, 50, 100] and you place a 100 on Team B, your bet matches with the first 100 from Team A. Bets are matched immediately as soon as both conditions are met: (1) same bet amount, and (2) opposite teams. Once matched, both bets are highlighted and booked."
    },
    {
      id: "queue-order",
      category: "Betting System",
      question: "What determines the order in the betting queue?",
      answer: "Bets are placed in the queue in the exact order they are submitted. When you click the bet button and confirm, your bet is added to the END of the queue. The system then checks if there's a matching bet at the FRONT of the opposite team's queue. This means first-in-first-out (FIFO) priority - earlier bets get matched before later ones. If you place a 50 Sweep Coin bet and there's already a 50 Sweep Coin bet waiting on the opposite team, your bet will match immediately. If not, you'll wait in line until someone places a matching bet."
    },
    {
      id: "coins",
      category: "Account & Credits",
      question: "How do I reload my Sweep Coins?",
      answer: "You can reload your Sweep Coins by clicking on your user profile and selecting 'Reload Coins', or by navigating to the Reload Coins page. Choose your desired amount and complete the transaction. Your balance will be updated immediately."
    },
    {
      id: "membership",
      category: "Account & Credits",
      question: "What is the membership system?",
      answer: "The membership system offers premium features and benefits. When you purchase a membership, you get enhanced access to betting features and exclusive updates. Your membership status is displayed in your account profile, and you can manage or cancel your membership at any time."
    },
    {
      id: "cancel-membership",
      category: "Account & Credits",
      question: "Can I cancel my membership?",
      answer: "Yes, you can cancel your membership at any time from your account settings. When you cancel, your membership will remain active until the end of your current billing period. After that, your account will return to standard status."
    },
    {
      id: "what-are-sweep-coins",
      category: "Account & Credits",
      question: "What are Sweep Coins?",
      answer: "Sweep Coins are the virtual currency used in Game Bird for placing bets. They represent your betting value and are used exclusively for wagering on games. Sweep Coins are independent from real money and are managed within the app for gaming purposes only. You can earn or reload Sweep Coins to participate in the betting system."
    },
    {
      id: "earn-sweep-coins",
      category: "Account & Credits",
      question: "How can I earn Sweep Coins?",
      answer: "You can earn Sweep Coins through several ways: by winning matched bets (when your team wins), by receiving promotional bonuses, through membership rewards, or by reloading them in the app. Your account starts with a certain amount of Sweep Coins, and winning bets increases your balance. Check your user dashboard to see all your Sweep Coin transactions and earnings."
    },
    {
      id: "sweep-coins-balance",
      category: "Account & Credits",
      question: "Where can I see my Sweep Coins balance?",
      answer: "Your current Sweep Coins balance is displayed prominently in your user profile/dashboard at the top right of the screen. It updates in real-time as you place bets or complete transactions. You can click on the balance to view detailed transaction history and see how your coins have changed over time."
    },
    {
      id: "reload-amounts",
      category: "Account & Credits",
      question: "What reload amounts are available for Sweep Coins?",
      answer: "Game Bird offers flexible reload options to suit different needs. You can reload in various amounts including 100, 200, 500, and higher denominations. Visit the 'Reload Coins' page to see all current reload options and choose the amount that works best for you. Your balance updates immediately upon completing a reload transaction."
    },
    {
      id: "sweep-coins-reset",
      category: "Account & Credits",
      question: "Do Sweep Coins expire or reset?",
      answer: "Sweep Coins do not expire - they remain in your account indefinitely until you use them for betting. Your balance persists across gaming sessions, so you can accumulate and use your Sweep Coins whenever you want. However, check the game rules for any specific session-based reset policies that may apply."
    },
    {
      id: "scoreboard",
      category: "Game Features",
      question: "What information does the Scoreboard show?",
      answer: "The Scoreboard displays real-time game information including: current game number, team scores (games won), balls remaining for each team, timer status, break status (which team has the break), and live game updates. It provides a complete view of the current match state."
    },
    {
      id: "admin",
      category: "Game Features",
      question: "What are admin controls?",
      answer: "Admin controls allow administrators to manage the game state, including starting matches, updating scores, managing balls, handling game rounds, and controlling the timer. Admin mode is protected by a password and can be locked/unlocked with the admin button in the scoreboard header."
    },
    {
      id: "history",
      category: "Records & Transparency",
      question: "How can I view my bet history?",
      answer: "Your complete bet history is available in your user profile or the User Dashboard. You can see all placed bets, matched bets, game results, and transaction history. This provides full transparency and a permanent record of your betting activity."
    },
    {
      id: "ledger",
      category: "Records & Transparency",
      question: "What is the Bet Ledger?",
      answer: "The Bet Ledger is an immutable record of all bets placed during a game session. It ensures complete transparency and fairness by maintaining a permanent, unalterable log of every bet. This guarantees that all betting activity is tracked and verifiable."
    },
    {
      id: "receipts",
      category: "Records & Transparency",
      question: "What are Bet Receipts?",
      answer: "Bet Receipts are confirmations issued for every bet placed. Each receipt contains details such as the bet amount, team selection, timestamp, and confirmation status. These receipts serve as proof of your betting activity and are stored for your records."
    },
    {
      id: "fair",
      category: "Fair Play & Rules",
      question: "How do you ensure fair play?",
      answer: "Game Bird implements multiple safeguards: immutable bet ledger for transparency, complete transaction history, real-time scoreboard updates, and secure admin controls. All betting activity is recorded and verifiable, ensuring complete fairness and accountability."
    },
    {
      id: "odds",
      category: "Fair Play & Rules",
      question: "What odds are used?",
      answer: "The betting system uses straightforward odds where matched bets create balanced pairs. When your bet is matched with an opposite team's bet of the same amount, both bets are booked at 1:1 odds, ensuring fairness for all participants."
    },
    {
      id: "pwa",
      category: "Technical",
      question: "What is a PWA (Progressive Web App)?",
      answer: "Game Bird is a Progressive Web App, which means you can use it in your web browser and also install it on your device for a native app-like experience. You can access it offline and receive notifications. Look for the install prompt in your browser to add it to your home screen."
    },
    {
      id: "support",
      category: "Support",
      question: "Where can I get help?",
      answer: "For support, check this FAQ page first for answers to common questions. If you need additional assistance, you can contact the support team through the app or visit the About page for more information about Game Bird."
    }
  ];

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  return (
    <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: '#0a1e2e' }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Button variant="outline" size="sm" style={{ borderColor: '#95deff', color: '#95deff' }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="h-8 w-8" style={{ color: '#fa1593' }} />
              <h1 className="text-4xl font-bold text-white">Frequently Asked Questions</h1>
            </div>
            <p className="text-lg" style={{ color: '#95deff' }}>
              Find answers to common questions about Game Bird Betting
            </p>
          </div>
        </div>

        {/* FAQ by Category */}
        {categories.map(category => (
          <div key={category} className="mb-12">
            <h2 
              className="text-2xl font-bold mb-6 pb-3 border-b-2"
              style={{ color: '#fa1593', borderColor: '#fa1593' }}
            >
              {category}
            </h2>

            <div className="space-y-4">
              {faqItems
                .filter(item => item.category === category)
                .map(item => (
                  <Card
                    key={item.id}
                    className="overflow-hidden transition-all cursor-pointer hover:shadow-lg"
                    style={{
                      backgroundColor: '#052240',
                      borderColor: '#95deff',
                      borderWidth: '2px'
                    }}
                    onClick={() => toggleItem(item.id)}
                  >
                    <CardHeader className="pb-3" style={{ background: 'linear-gradient(to right, #95deff, #004b6b)' }}>
                      <div className="flex items-center justify-between">
                        <CardTitle 
                          className="text-lg font-semibold text-white"
                        >
                          {item.question}
                        </CardTitle>
                        <div className="ml-4">
                          {expandedItems.includes(item.id) ? (
                            <ChevronUp className="h-6 w-6" style={{ color: '#fa1593' }} />
                          ) : (
                            <ChevronDown className="h-6 w-6" style={{ color: '#95deff' }} />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {expandedItems.includes(item.id) && (
                      <CardContent className="pt-4 pb-4" style={{ backgroundColor: '#004b6b' }}>
                        <p className="text-base leading-relaxed" style={{ color: '#95deff' }}>
                          {item.answer}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          </div>
        ))}

        {/* Still Have Questions */}
        <Card 
          className="mt-12 border-2"
          style={{
            backgroundColor: '#052240',
            borderColor: '#fa1593',
            boxShadow: '0 0 30px rgba(250, 21, 147, 0.3)'
          }}
        >
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Still Have Questions?</h3>
            <p className="mb-6" style={{ color: '#95deff' }}>
              Can't find the answer you're looking for? Check out our other resources or contact support.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/about">
                <Button 
                  className="px-6 py-2 text-white font-semibold"
                  style={{ backgroundColor: '#fa1593' }}
                >
                  Learn More About Us
                </Button>
              </Link>
              <Link to="/">
                <Button 
                  variant="outline" 
                  className="px-6 py-2"
                  style={{ borderColor: '#95deff', color: '#95deff' }}
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;
