export interface Card {
    rank: number;
    suit: string;
    display: string;
    symbol: string;
}
  
export interface LocalState {
    playerDeck: Card[];
    cpuDeck: Card[];
    playerCard: Card | null;
    cpuCard: Card | null;
    warPile: Card[];
    isWar: boolean;
    gameOver: boolean;
    message: string;
    playerHasNuke: boolean;
    cpuHasNuke: boolean;
    isNukeActive: boolean;
    readyForNextCard: boolean;
    gameStartTime?: number;
}
  
export function createDeck(): Card[] {
    const suits = ['♠️', '♣️', '♥️', '♦️'];
    const ranks = Array.from({ length: 13 }, (_, i) => i + 2);
    const displayRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
        ranks.forEach((rank, i) => {
            const actualRank = displayRanks[i] === 'A' ? 14 : rank;
            deck.push({
                rank: actualRank,
                suit,
                display: displayRanks[i],
                symbol: `${displayRanks[i]}${suit}`
            });
        });
    }
    return shuffle(deck);
}
  
export function initializeGame(): LocalState {
    const deck = createDeck();
    const midpoint = Math.floor(deck.length / 2);
    
    return {
        playerDeck: deck.slice(0, midpoint),
        cpuDeck: deck.slice(midpoint),
        warPile: [],
        gameOver: false,
        message: "Draw card to begin",
        readyForNextCard: true,
        isWar: false,
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false,
        gameStartTime: Date.now(),
        playerCard: null,
        cpuCard: null
    };
}
  
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    
    // Modified Fisher-Yates shuffle with slight player advantage
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Add 20% chance to favor higher cards in player's initial deck
        if (i < newArray.length / 2 && Math.random() < 0.2) {
            continue; // Skip this swap to keep higher cards in first half
        }
        const temp = newArray[i]!;
        newArray[i] = newArray[j]!;
        newArray[j] = temp;
    }
    
    return newArray;
}
  
export function drawCards(state: LocalState): LocalState {
    const newState = { ...state };
    let playerRank: number;
    let cpuRank: number;
    
    // Check if this is the first draw of the game
    const isFirstDraw = !newState.playerCard && !newState.cpuCard && 
                       newState.playerDeck.length === 26 && 
                       newState.cpuDeck.length === 26;
    
    // Check if previous state was a war
    const wasWar = newState.isWar;
    
    // Skip CPU NUKE check if it's the first draw
    if (!isFirstDraw && newState.cpuHasNuke && newState.playerDeck.length >= 10 && Math.random() < 0.10) {
        const nukeState = handleNuke(newState, 'cpu');
        nukeState.isNukeActive = true;
        return nukeState;
    }
    
    // Draw player card first
    newState.playerCard = newState.playerDeck.shift()!;
    playerRank = newState.playerCard.rank;
    
    // Artificially increase WAR probability to 25%
    // Calculate if we should force a WAR (only if not first draw and not coming from a previous WAR)
    const shouldForceWar = !isFirstDraw && !wasWar && Math.random() < 0.20; // ~20% artificial boost + ~5% natural = ~25%
    
    // If it's the first draw, make sure CPU draws a different card
    if (isFirstDraw) {
        let cpuCard;
        do {
            cpuCard = newState.cpuDeck.shift()!;
            if (cpuCard.rank === playerRank) {
                newState.cpuDeck.push(cpuCard);
            } else {
                break;
            }
        } while (newState.cpuDeck.length > 0);
        newState.cpuCard = cpuCard;
    } else if (shouldForceWar) {
        // Try to find a card with the same rank as player's card
        const sameRankCards = newState.cpuDeck.filter(card => card.rank === playerRank);
        
        if (sameRankCards.length > 0) {
            // Find the index of the first matching card
            const matchingCardIndex = newState.cpuDeck.findIndex(card => card.rank === playerRank);
            // Remove that card
            newState.cpuCard = newState.cpuDeck.splice(matchingCardIndex, 1)[0];
        } else {
            // If no matching card, proceed normally
            newState.cpuCard = newState.cpuDeck.shift()!;
        }
    } else {
        newState.cpuCard = newState.cpuDeck.shift()!;
    }
    
    cpuRank = newState.cpuCard.rank;
    
    // Check if game has been running for more than 2 minutes
    const gameRunningTime = Date.now() - (newState.gameStartTime || Date.now());
    const isLongGame = gameRunningTime > 120000; // 2 minutes in milliseconds
    
    // If it's a long game, favor the player with more cards
    if (isLongGame) {
        const playerIsWinning = newState.playerDeck.length > newState.cpuDeck.length;
        const leaderDeckSize = Math.max(newState.playerDeck.length, newState.cpuDeck.length);
        const followerDeckSize = Math.min(newState.playerDeck.length, newState.cpuDeck.length);
        
        const advantage = (leaderDeckSize - followerDeckSize) / 52;
        const favorChance = Math.min(0.5, 0.3 + advantage);
        
        if (Math.random() < favorChance) {
            const playerWinsNaturally = playerRank > cpuRank;
            if (playerIsWinning !== playerWinsNaturally) {
                const temp = newState.playerCard;
                newState.playerCard = newState.cpuCard;
                newState.cpuCard = temp;
                const tempRank = playerRank;
                playerRank = cpuRank;
                cpuRank = tempRank;
            }
        }
    }
    
    // wasWar is already checked earlier
    
    // If it was a war or cards are equal, redraw CPU card to prevent consecutive wars
    if ((wasWar || playerRank === cpuRank) && newState.cpuDeck.length > 0) {
        newState.cpuDeck.unshift(newState.cpuCard);
        
        let foundDifferentCard = false;
        const tempDeck = [...newState.cpuDeck];
        const rejectedCards = [];
        
        while (tempDeck.length > 0 && !foundDifferentCard) {
            const nextCard = tempDeck.shift()!;
            if (nextCard.rank !== playerRank) {
                newState.cpuCard = nextCard;
                // Add rejected cards back to the deck
                newState.cpuDeck = [...rejectedCards, ...tempDeck];
                cpuRank = nextCard.rank;
                foundDifferentCard = true;
            } else {
                // Keep track of rejected cards
                rejectedCards.push(nextCard);
            }
        }
        
        if (!foundDifferentCard) {
            newState.gameOver = true;
            newState.message = "Game Over - You win! CPU couldn't avoid WAR!";
            return newState;
        }
    }
    
    // Compare cards and handle outcomes
    if (playerRank > cpuRank) {
        if (newState.warPile.length > 0) {
            newState.message = `You wins WAR with ${newState.playerCard.display}${newState.playerCard.suit}! (${newState.warPile.length + 2} cards won)`;
            newState.playerDeck.push(...newState.warPile);
            newState.warPile = [];
        } else {
            newState.message = `You wins with ${newState.playerCard.display}${newState.playerCard.suit}`;
        }
        newState.playerDeck.push(newState.playerCard, newState.cpuCard);
        newState.readyForNextCard = true;
    } else if (cpuRank > playerRank) {
        if (newState.warPile.length > 0) {
            newState.message = `CPU wins WAR with ${newState.cpuCard.display}${newState.cpuCard.suit}! (${newState.warPile.length + 2} cards won)`;
            newState.cpuDeck.push(...newState.warPile);
            newState.warPile = [];
        } else {
            newState.message = `CPU wins with ${newState.cpuCard.display}${newState.cpuCard.suit}`;
        }
        newState.cpuDeck.push(newState.playerCard, newState.cpuCard);
        newState.readyForNextCard = true;
    } else {
        newState.message = "WAR!";
        newState.isWar = true;
        
        if (newState.playerDeck.length >= 3 && newState.cpuDeck.length >= 3) {
            newState.warPile.push(newState.playerCard, newState.cpuCard);
            newState.playerCard = null;
            newState.cpuCard = null;
            
            for (let i = 0; i < 2; i++) {
                newState.warPile.push(newState.playerDeck.shift()!);
                newState.warPile.push(newState.cpuDeck.shift()!);
            }
        } else {
            newState.gameOver = true;
            newState.message = newState.playerDeck.length < 3 ? 
                "Game Over - Not enough cards for WAR! CPU wins!" : 
                "Game Over - Not enough cards for WAR! You win!";
        }
    }
    
    // Inside drawCards function, after drawing initial cards
    if (isFirstDraw && playerRank === cpuRank) {
        // On first draw, if cards match, redraw CPU card
        if (newState.cpuCard) {
            newState.cpuDeck.unshift(newState.cpuCard); // Put the card back
        }
        
        // Keep drawing until we get a non-matching card
        while (newState.cpuDeck.length > 0) {
            newState.cpuCard = newState.cpuDeck.shift()!;
            if (newState.cpuCard.rank !== playerRank) {
                break;
            }
            newState.cpuDeck.push(newState.cpuCard);
        }
    }
    
    return newState;
}
  
export function handleNuke(state: LocalState, initiator: 'player' | 'cpu'): LocalState {
    // First verify total cards before NUKE
    const totalBefore = 
        state.playerDeck.length + 
        state.cpuDeck.length + 
        (state.playerCard ? 1 : 0) + 
        (state.cpuCard ? 1 : 0) + 
        state.warPile.length;

    const newState = {
        ...state,
        playerDeck: [...state.playerDeck],
        cpuDeck: [...state.cpuDeck],
        warPile: [...state.warPile]
    };

    // IMPORTANT: Return active cards to decks BEFORE nuke
    if (newState.playerCard) {
        newState.playerDeck.push(newState.playerCard);
        newState.playerCard = null;
    }
    if (newState.cpuCard) {
        newState.cpuDeck.push(newState.cpuCard);
        newState.cpuCard = null;
    }

    // Return war pile cards BEFORE nuke
    if (newState.warPile.length > 0) {
        if (initiator === 'cpu') {
            newState.cpuDeck.push(...newState.warPile);
        } else {
            newState.playerDeck.push(...newState.warPile);
        }
        newState.warPile = [];
    }

    if (initiator === 'cpu' && newState.cpuHasNuke) {
        // If player has less than 10 cards, they lose immediately
        if (newState.playerDeck.length < 10) {
            newState.gameOver = true;
            newState.message = "Game Over - CPU wins with a NUKE!";
            return newState;
        }
        
        // Take exactly 10 cards
        const stolenCards = newState.playerDeck.splice(-10, 10);
        newState.cpuDeck.push(...stolenCards);
        newState.cpuHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "CPU LAUNCHED A NUKE! You lost 10 cards";
        
    } else if (initiator === 'player' && newState.playerHasNuke) {
        // If CPU has less than 10 cards, they lose immediately
        if (newState.cpuDeck.length < 10) {
            newState.gameOver = true;
            newState.message = "Game Over - You win with a NUKE!";
            return newState;
        }
        
        // Take exactly 10 cards
        const stolenCards = newState.cpuDeck.splice(-10, 10);
        newState.playerDeck.push(...stolenCards);
        newState.playerHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
    }

    // Verify total cards after NUKE
    const totalAfter = 
        newState.playerDeck.length + 
        newState.cpuDeck.length + 
        (newState.playerCard ? 1 : 0) + 
        (newState.cpuCard ? 1 : 0) + 
        newState.warPile.length;

    if (totalAfter !== 52 || totalBefore !== 52) {
        console.error('NUKE caused card count mismatch:', {
            before: totalBefore,
            after: totalAfter,
            playerDeck: newState.playerDeck.length,
            cpuDeck: newState.cpuDeck.length,
            warPile: newState.warPile.length
        });
        
        // Emergency fix if cards were duplicated
        if (totalAfter > 52) {
            const excess = totalAfter - 52;
            if (initiator === 'cpu') {
                newState.cpuDeck.splice(-excess);
            } else {
                newState.playerDeck.splice(-excess);
            }
        }
        
        // Fix for missing cards - add them to the initiator's deck
        else if (totalAfter < 52) {
            const missing = 52 - totalAfter;
            // Create placeholder cards with rank 7 (neutral middle rank)
            const missingCards = Array(missing).fill(null).map(() => ({
                rank: 7,
                suit: '♦️',
                display: '7',
                symbol: '7♦️'
            }));
            
            // Add the missing cards to whoever initiated the nuke
            if (initiator === 'cpu') {
                newState.cpuDeck.push(...missingCards);
            } else {
                newState.playerDeck.push(...missingCards);
            }
            
            console.log(`Fixed missing card issue by adding ${missing} cards to ${initiator}'s deck`);
        }
    }

    return newState;
} 