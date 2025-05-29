var rooms = {
    "start": {
        "description": "You wake up on a <b>couch</b>, you're surrounded by empty baggies and theres a <b>fatlad</b> snoring on the floor. Gabber blasts from the <b>kitchen</b> , the party is still in full swing. Through the doorway to the <b>hall</b> you can see an amorphic mass surging to the front door.  ",
        "directions": {
            "kitchen": "kitchen1",
            "hall": "hall1",
            "couch":"couch1"
        },
        "speak": {
            "fatlad": 'You go over and poke the fella on the floor, he farts long and hard, an eternity passes and he opens a single crusted eye. "enter the basement at thy owneth peril, for it contains horrors incomprehensible " His arse takes one last girthy breath as he rolls over and returns to slumber. '
        },
        "examine": {
            "couch": "You put your hands down the back of the couch, you drag your hands through millions of years of biscuit crumbs and you find half a <b>jammy dodger</b>. You reach the middle split and your body feels a greater force pulling you through the <b>couch</b>, theres something beyond the crevice.",
            "baccy": "you examine the pouch, yout cousin brought it back from marbella 6 months ago, pure dusht",
            "snickers": "you look at the snickers, its two weeks out of date. Hopefully no one has peanut allergies here"
        },
        "use": {
            "baccy": "You roll up and have a smoke, how do you get out of this fucking place?",
            "snickers": "You eat the snickers, your stomach turns. That definitely wasn't the cure"
        },
        "pickup": {
            "jammydodger": "for some reason you pickup the jammy dodger, thats a tad bit disgusting you should be ashamed"
        }
    },
    "couch1": {
        "description": "You dig your forearms into the crevice, the couch begins to consume you, gagging like a boa constrictor. You accept your fate amongst the biscuits at the back of the couch, sliding through the fabric membranes of the upholstery. You feel around and theres a wall of flesh, muscle and mucus. Perhaps you could use something to break through?  ",
    "directions": {
            "start": "start"
        },
        "use": {
            "glock": "you pull out the glocky from your waistband and blast at the wall point blank, it contracts and expands as you pepper it with holes. The gooey fabric shits you out through the bullet holes in the muscle. / you fall into the <b>dark</b>  ",
            "baccy": "You roll up and have a smoke, how do you get out of this fucking place?"
        },
        "examine": {
            "couch": "you are stuck ya cunt"
        },
        "pickup": {
            "jammydodger": "for some reason you pickup the jammy dodger, thats a tad bit disgusting you should be ashamed"
        }
    
    },
    "kitchen1": {
        "description": "You drag yourself to the kitchen, a drab 70's fitted job. <b>curtains</b> are pulled off the pole and now adorn the Dj's shoulders. He's surrounded by three lads each a slightly different variation of the last. Their heads turn as you enter the room. You consider <b>talking</b> to the <b>scobes</b> but you hear a blood-curdling scream come from the <b>hall</b> ",
        "directions": {
            "start": "start",
            "hall": "hall1",
            "kitchen": "kitchen1",
            "fight": "fight1",
            "flight": "flight1"
        },
        "speak": {
            "scobes": 'The scobes address you as soft fella, they resemble deranged fighter pilots, crusty noses and aviator glasses. their triangular formation snorting lines in the sky. The lead scobe produces a threating finger. "Wheres my money ya little fucker". What do do? <b>fight</b> or <b>flight</b>? '
        },
        "examine": {
            "curtains": "You can make out a tapestry on the curtains, its motif, a repeat pattern centred on medallions with a motif of a hero slaying three horned beasts, a key protuding from the ribcage of the largest beast"
        },
        "use": {
           
           "glock" : "You brandish the glock 40, the three scobes and the dj cower in fear behind the breakfast bar. You blast two warning shots in the roof. a single hand flings a small <b>pouch</b> from behind the counter landing at your feet ",
           "baccy": "You roll up and have a smoke, how do you get out of this fucking place?"
        },
        "pickup": {
            "pouch": "you pick up the pouch, it contains two malteasers and a packet of peanut M&M's You're mildly baked so you consume the malteasers and keep the <b>peanut M&M's<b/> "
        }
 
    },
    "flight1": {
        "description": "You run out the back door into the <b>garden</b>, there are three <b>trolls</b> roasting some mysterious meats and smoking herb from a pipe. You can barely make out the three figures from the pungent smoke cloud engulfing them. \
     They haven't seen you yet. What do you do?",
        "directions": {
            "start": "start",
            "kitchen": "kitchen1",
            "hall": "hall1",
            "fight": "fight2",
            "flight": "flight2"
        },
        "speak": {
            "trolls": 'You walk up to the trolls and introduce yourself. it takes them an age to turn and notice you. The largest and most menacing closes his single eye  "thank the heavens, DESSERT!". oh fuck, do you <b>fight</b> or <b>flight</b>'
        }
    },
    "fight2": {
        "description": 'You run over to their spitroast fire and kick it over, the trolls scream. Their pained grimaces emerging from the thick smoke. You turn to the largest and most menacing, he smashes his fist into his palm and extends his arm towards you putting his index finger within inches of your face. "MY BLEEDIN DINNER YA SMELLY CUNT"   \
      What do you do?',
        "use": {
            "glock": 'You pull out the stick and start blasting with the gangsta side grip. The bullets cutting through the smoke and propelling the trolls head back into the smokey shadows. His compadres burst into ruptuous laughter. a face comes slowly back into view. Smoke streaming from his nose and a wry smile. / A tree trunk sized arm with a great fist on the end emerges from the smoke. you arch your head as it swings your way and you feel your spine kiss your arsebone with the impact. / YOU ARE DEAD   '
        }
    },
    "flight2": {
        "description": 'You run along the path surrounding the house, you trip on something. You pick yourself up and investigate. Its a hatch down into the <b>basement</b>"   \
      What do you do?',
        "use": {
            "glock": 'You pull out the stick and start blasting with the gangsta side grip. The bullets cutting through the smoke and propelling the trolls head back into the smokey shadows. His compadres burst into ruptuous laughter. a face comes slowly back into view. Smoke streaming from his nose and a wry smile. / A tree trunk sized arm with a great fist on the end emerges from the smoke. you arch your head as it swings your way and you feel your spine kiss your arsebone with the impact. / YOU ARE DEAD   '
        }
    },
    "hall1": {
        "description": "You enter the <b>hall</b>, enveloped into the ebb and flow of a crowd surging towards the front door. You paddle through flesh and reach the door. A <b>golem</b> like figure guards the door. Through the clear plastic sandwich bag held over his nose, You can see his clay nose decaying from inhalants. He doubles over coughing and throws an arm out. Indicating to the fish bowl sitting precariously on the corner of a large trophy case, full to the brim with bowling trophies. You approach the fish cage with a finnesse, you throw an arm around the water filled bowling ball. Do you <b>examine</b> the <b>bowl?</b> or do you go <b>bowling</b>?   ",
        "directions": {
            "bowling": "strike1",
            "hand": "hand1",
            "kitchen": "kitchen1"
        },
        "examine": {
            "hall": "You see a glock being knocked around on the floor"
        },
        "pickup": {
            "glock": "you pick up the stick and put it in the waistband of your jocks, you packin "
        }
    },
    "bridge2": {
        "description": "You try to cross the bridge but a troll jumps out and bites your leg!",
        "directions": {
            "east": "bridge1"
        }
    }
   
}



