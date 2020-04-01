# Exolve

## An Easily Configurable Interactive Crossword Solver

### Version: Exolve v0.59 April 1 2020

The file *exolve.html* contains *all* the code you need: just make a copy and
then replace the part that contains the example grid with your own puzzle
specification, starting at the "exolve-begin" line and ending at the
"exolve-end" line.

[exolve-m.html, exolve-m.css, exolve-m.js have the same  content as exolve.html,
except that it is split into separate parts: html (including the puzzle
specification), CSS, and JavaScript.]

Here is a minimal example of the puzzle specification:

```
exolve-begin
  exolve-id: tiny-42
  exolve-title: Tiny Demo Crossword
  exolve-setter: Exolve
  exolve-width: 5
  exolve-height: 5
  exolve-grid:
    HELLO
    O...L
    WORLD
    L...E
    STEER
  exolve-across:
    1 Greeting (5)
    3 Earth (5)
    4 Guide (5)
  exolve-down:
    1 Emits cry (5)
    2 More ancient (5)
exolve-end
```

The format is very simple and uses plain text (but the parsing code is
also simplistic and not very forgiving, so please go through the format
documentation). The setter has the option to provide solutions (as in the
example above), or just use 0 to indicate a square that needs to be filled
(i.e., part of a "light," in crossword terms).

A few example puzzles are also included in this directory, each in a file with
the ".exolve" extension. These showcase some of the available features, such as
ninas, additional clues or questions, submission, barred puzzles, diagramless
puzzles, etc. To try one of these, create a copy of exolve.html and edit it as
described above, splicing in the whole .exolve file from exolve-begin to
exolve-end.

## Controls
The basic control is to click on a square and enter a letter in it. If a square
is a part of both an across clue and a down clue, then clicking on that square
while it is the current square (or pressing the Enter key) will toggle the
active direction.

The control buttons (*Clear this*, *Clear all*, *Check this*, *Check all*,
*Reveal this*, and *Reveal all*) work as suggested by their names ("this" refers
to the currently selected clue(s)). You can click on a clue to jump to its
squares. If the setter has not provided all solutions, then only the
"Clear this/all" control buttons are shown, the "Check/Reveal" buttons do not
get shown.

The "Clear this" button at first only clears letters that do not cross other
fully filled lights, if there are any. If there are none (i.e., if all remaining
letters in the current light also cross other fully filled lights), only then
will these remaining letters get cleared.

Exolve supports diagramless puzzles, where the blocked squares are not
identified and the solver has to figure out their locations. In fact, exolve
supports *partially* diagramless puzzless, where only some squares or some
partial areas of the grid do not show where the blocked squares are. While
solving such a puzzle, the solver can press the space bar in a diagramless
square to posit that it is a blocked square (the dark square character, ⬛,
will get placed in that square. It can be deleted just like any other regular
entry). Further, when a user enters or clears a blocked square in a diagramless
cell, the appropriate action will also be taken in the square that is the
symmetric counterpart of the current square.

If the setter has provided annotations by appending annotations at the end of
some clues, then these annotations get shown when the solver clicks
"Reveal all". Clue-specific annotations get revealed/hidden with
"Reveal/Clear this" buttons (unless the clue only has diagramless cells).
Additionally, "Check this" and "Check all" behave like "Reveal this" and
"Reveal all" respectively, if they find no mistakes. In a puzzle in which
solutions are not provided, the "Reveal this" button will still get shown if
there are any clues for which annotations are present (these annotations may be
full solutions or just hints, possibly).

If the setter has provided the location of one or more ninas (through
exolve-nina sections), then an additional button control, *Show ninas*, gets
shown, for the solver to see where the ninas are. The button can be clicked
again to hide the nina locations. Ninas also get shown on clicking "Reveal all".

If the setter has asked additional questions in the puzzle (through
exolve-question sections), then input fields for these get shown too.
"Reveal/Clear all" controls buttons also include revealing/clearing
answers to these questions apart from showing/hiding annos/explanations/ninas.

If the setter has set up a submit URL (with an exolve-submit section—the URL
can be set up using a Google Form, for instance), then there is a *Submit*
buttion.

When the solver enters a letter in a square, the cursor automatically jumps to
the next square for the currently active clue (the next square can be from a
different clue, when there are linked clues that "cover" multiple clues). In a
diagramless square in a puzzle for which the solver has not provided all
solutions, there is no such automatic move after entereing a letter (as the
software itself has no way of knowing where the next square is).

The solver can press Tab/Shift-Tab to navigate to the next/previous clue in the
current direction. The solver can use the arrow keys to navigate to the
next/previous light cells in the direction of the arrow.

The software tries to keep the current clue visible when scrolling, as long
as the square with the cursor is visible.

"Clear/Check/Reveal all" buttons, the "Show ninas" button, and the "Submit"
button solicit additional confirmation from the solver.

You can click on the black background or on the puzzle title to unhighlight
the current clue (for printing or screenshotting, for example).

## Format
The puzzle can contain the following "sections" between the exolve-begin line
and the exolve-end line:

* exolve-id
* exolve-title
* exolve-setter
* exolve-copyright
* exolve-credits
* exolve-prelude
* **exolve-width**
* **exolve-height**
* **exolve-grid**
* exolve-across
* exolve-down
* exolve-nodir
* exolve-explanations
* exolve-nina
* exolve-colour
* exolve-question
* exolve-submit
* exolve-option

Each section has the section name (exolve-something), followed by a colon.
Other than the exolve-prelude, exolve-grid, exolve-across, exolve-down,
exolve-nodir, and exolve-explanations sections, all other sections occupy a
single line (some can be repeated though). For such single-line sections, the
"value" of the section is the text following the colon on the same line.

The bolded sections, namely, exolve-width, exolve-height, and exolve-grid
are required. The other sections are optional, but exolve-across, exolve-down,
exolve-id, exolve-title, exolve-setter should probably be present in most
puzzles.

Any line (or trailing part of a line) that begins with a "# " is treated
as a comment and is ignored. A "#" with an end-of-line after it is also treated
as a comment. Note that a "#" with a non-space character after it is NOT treated
as a somment (this is so because we may have HTML colour names such as #FF00FF
in exolve-colour sections, and we may have clues in which their grid-location
is indicated in the #xN notation—see the exolve-across section later).
I did not use "//" as the comment marker as it is used in URLs.

## exolve-id
Provide a unique id. Use only alphanumeric characters and dashes (-). This
id is used as the key for saving/restoring state. You can create an unsolved
version of a puzzle (to run a contest, for example) and, later, a version of
the same puzzle that has the solutions, giving them both the same exolve-id.
Then, when solvers visit the version with solutions, they can see their own
entries and see which mistakes they made, if any. Example:
```
  exolve-id: tiny-42
```

## exolve-title, exolve-setter
The title of the puzzle and the name/pseudonym of the crossword setter. Example:
```
  exolve-title: My Lovely Crossword
  exolve-setter: Narsi Sus
```

## exolve-copyright
If your provide this, it will be displayed with the copyright symbol, under
the rendered puzzle grid. Example:
```
  exolve-copyright: 2019 Viresh Ratnakar
```

## exolve-credits
If your provide this, it will be displayed under the copyright. You can provide
multiple instance of this.
Example:
```
  exolve-credits: Test solver: Zaphod Beelblebrox
  exolve-credits: Custom code: H. A. C. Ker
```

## exolve-width, exolve-height
The width and height of the puzzle—i.e., how many squares across and how many
squares down is the crossword grid. Example:
```
  exolve-width: 15
  exolve-height: 15
```

## exolve-prelude
Crossword puzzles often come with a prelude that contains special instructions
and/or hints. The prelude text occupies multiple lines—starting from the
line *after* the exolve-prelude: line, and going all they way down to the line
preceding the next exolve-foo section. The prelude may include html tags. The
prelude is rendered just above the grid, in the rendered puzzle. Example:
```
  exolve-prelude:
    Words should be entered in the grid <i>after</i> deleting one letter. The
    letters thus deleted, in clue order, form the name of a famous farm
    animal.
```

## exolve-grid
The grid specification starts from the line *after* the exolve-grid and goes all
the way to the next exolve- section. There should be exactly as many lines
in this section as the height of the grid. On each line, the squares in that
row of the grid are specified.

There are two kinds of puzzles: with solutions provided and without solutions.
Here are simple examples of both:

Grid with solutions:
```
  exolve-grid:
    ACE
    R.R
    EAR
```
This is a 3x3 grid with one blocked square in the center ("." is used to
indicate blocked squares). In this grid, 1 Across = ACE, 1 Down = ARE,
3 Down = ERR, and 3 Across = EAR. When solution letters are included like this,
the control buttons for checking/revealing answers get shown. 

Grid without solutions:
```
  exolve-grid:
    000
    0.0
    000
```
This is also a 3x3 grid, but no solutions have been provided (every light is
shown using the letter "0"). In such a grid, the control buttons for checking/
revealing answers do not get shown.

It is also possible to specify barred grids, instead of blocked ones. In fact,
it is possible to specify a a grid that uses both bars and blocks. Bars (and
some other special treatments) are specified using letters that follow the main
grid square specifier, which we'll refer to as *decorators*. A bar to the right
of a square is specified using the decorator |. A bar under a square is
specified using the decorator \_. A square that has both a bar after and a bar
under can use "|\_" or the shortcut for that, "+". Arbitrary many spaces are
allowed between grid square specifications, and spaces can (*should!*) be used
to line up the squares in the presence of decorators. Here is an example 3x3
grid that uses both bars and blocked squares:
```
  exolve-grid:
    A M|B
    X . E
    E|A T
```

The decorator "@" can also be used to inscribe circles inside some squares, and
the decorator "\*" can be used to indicate that a square is to be diagramless.
Here's the last example again, this time with circles around some cells, and
some cells being diagramless:
```
  exolve-grid:
    A  M|@B
    X* .  E*
    E| A  T
```

The decorator "!" can be used to mark a cell as pre-filled (its solution letter
must be provided). The solution letter will be pre-filled and will not be
editable. If all entries in a light are prefilled, and an anno is provided
for that clue, the anno will be shown automatically at start-up.

Here again is the complete list of decorators:
```
| draw bar after
_ draw bar under
+ draw bar after and under
@ draw circle
* diagramless
! prefilled
```

## Some details about clue numbers
Across and down clue numbers are automatically inferred from the grid, except
in two cases. The first is when there are diagramless cells and solutions
have not been provided. The second is when the setter opts to deliberately
not provide associations between grid squares and clues, by using non-numeric
clue labels without providing their grid locations. When the solver is entering
a value in a light for which the clue association is not known, the highlighted
"current clue" browsable interface runs through all the clues for which no
grid cells are known.

## Some details about diagramless cells
Note that "diagramlessness" only hides from the solver whether a square is
in a light or is a blocked square—if the setter has used any bars, they do get
displayed to the solver, even in diagramless cells.

If a puzzle with diagramless squares has specified all solutions, then
check/reveal controls get displayed. For example, revealing a blocked
diagramless square will show the dark square character, ⬛, in that square. 

If the solver wants to *not* provide solutions for a puzzle that has some
diagramless squares, then the blocked square marker (".") should not be used
in the blocked squares that are also diagramless (otherwise the solver can peak
into the HTML source and see where the blocked squares are). Each diagramless
square should be specified with a "0" followed by the diagramless decorator,
i.e., "0\*". But then, even the exolve software has no way of knowing which
grid square any clue starts on. However, sometimes, even in a puzzle with
diagramless squares, the setter does want to provide the clue start locations
for *some* clues. Exolve provides a way to do this: the setter can optionally
include the location of the square where a clue starts for any clue, using the
chessboard notation. Details are provided in the exolve-across/down section
below.

## exolve-across, exolve-down, exolve-nodir
The exolve-across and exolve-down sections should be used to specify the across
and down clues, respectively (exolve-nodir is for the special/rare case of
clues that do not have a specified direction; we will describe it at the end of
this section). There should be one clue per line, and there should not be any
blank lines. The clues should start with the clue number, and end with the
enum (the enum is not strictly required). Example:
```
  exolve-across:
    1 Untouchable service (3)
    3 Listener (3)
  exolve-down:
    1 Happen to be (3)
    2 Make a mistake (3)
```

If the enum indicates multiple words (for example, *(4,3)*), or if the enum
indicates hyphenated words (for example, *(4-2)*), then the word boundary or
the hyphen gets displayed in the grid, to help solvers. The software uses the
following criteria to decide what constitites the enum part of a clue: a pair
of opening and closing parentheses, containing only numbers, hyphens, commas,
and apostrophes, starting with a number. The software also treats a pair of
parentheses containing the text "word" or "letter" or "?" with anything before
are after it as an enum (to allow the setter to specify the enum as
"(two words)" or "(?)", for example).

In a grid with solutions provided, the setter may include annotations for
explaining how a clue works or for providing hints. Any text located after the
enum in a clue is treated as annotation. The annotation is displayed when the
solver clicks on the "Reveal all" button or on the "Reveal this" button when
that clue is the current clue. Example:
```
  exolve-across:
    28	Replace bottles containing questionable medicine (7) Def: questionable medicine. Hidden word: (-re)PLACE BO(-ttles).
```

If a clue "covers" other "children clues," this can be indicated by appending
a comma-separated list of children clue numbers to the parent clue number.
Example:
```
  exolve-across:
    1, 5, 2d In spite of adverse circumstances (7,3,4)
    5 See 1 Across
    ...
  exolve-down:
    2 See 1 Across
```
As shown in the above example, if a child clue (2d in the example) has a
different direction from the parent, the direction can be specified with a
one-letter suffix ("a" or "d").

While solving, when a light is fully filled in, its clue number changes
colour (to a light shade of blue, making the unsolved clue numbers stand out).
There are some minor exceptions when this does not happen (diagramless cells
or other reasons that don't let us determine when a clue's light is fully
filled). For such clues, the solver can click on the clue number to set (or
unset) its "has-been-solved" state manually.

As mentioned in the previous section, in a grid that has diagramless squares
and that does not provide solutions, if the setter wants to display some clue
numbers in squares, they can do so by prepending the clue (in the exolve-across
or exolve-down section) with "#xN", there x is the column ("a" being the first
column, "b" being the second column, etc.) and N is the row number (1 being the
bottom row, 2 being the row above the bottom row, etc.). This is essentially
an extension of the chessboard notation. I considered using programming
notation, but went with this for hopefully wider understanding. This notation
is also used for specifying ninas. Example:
```
  exolve-across:
    #a9 15 Imprison and tie perhaps
```
In this example, the clue number (15) will get displayed in the square that is
in the first column and the 9th row from the bottom.

### Filler lines between clues
Any line in a clues section (i.e., in exolve-across/exolve-down/exolve-nodir)
that cannot be parsed as a clue is treated as a filler line. It is simply
displayed in that position in the list of clues. It is an error to place
a filler line after the last clue in a clues section. Filler lines can
be used to demarcate sections within clues, if needed. Example:
```
  exolve-across:
    1 Communication device (5)
    7 Greeting (5)
    <i>The following entries all begin with B.</i>
    9 Unreachable sound in 1 (4,4)
    15 Zaphod (10)
```

### Splitting long clue lists
Any line in a clues section that starts with --- initiates the rendering of
a new table of clues.

### Non-numeric clue labels
If you want to use non-numeric clue labels (such as A, B, C, etc.), you can
do that by enclosing the non-numeric clue label in square brackets, like this:
Example:
```
  exolve-across:
    2 Imprison and tie perhaps (6)
    [F] Enjoyable (3)
    5 Hitchhiker's accessory (5)
    #a12 [G], 4, [H] Fitting reply (3,3,3)
    ...
```
For non-numeric clue labels, the software does not know which cell the clue
begins in, unless it is specified explicitly by the setter using a "#xN"
prefix as described above and shown in the fourth clue example above.

### Trailing period in clue labels
A trailing period after a clue number or label is considered to be just a
punctuation mark and is ignored. All the five periods in the following
example get ignored:
```
    2. Clue (4)
    3.Ignorance is _____ (5)
    4 . Time for every one to end, finally (6)
    [Q.]. Hop (4)
```

### Clues without a specified direction
If you want to create a section of clues without a specified across/down
direction, you can use an exolve-nodir section, which has the same structure
as exolve-across and exolve-down, but the direction of each clue in this
section is considered unspecified. Setters would probably want to use this
section with non-numeric clue labels. Example:
```
  exolve-nodir:
    [P] Direct (5)
    [Q] Server spilling one's drink (5)
    ...
```
The clue label can be numeric too, and the starting cell can also be specified
using the "#xN" prefix as described above.

If the setter is using  nun-numeric clue labels or clues without a specified
direction, then they should probably also use the option "hide-inferred-numbers"
in an exolve-option section.

### Nodir clues with cells explicitly specified
In a nodir clue, you can specify not just the starting cell, but _all the cells_
using the chessboard notation. If you do that, then clicking on a cell in that
clue will highlight and allow entry in all the cells for that clue (cells in
a nodir clue can be scattered arbitrarily in the grid). Example:
```
  exolve-nodir:
    #c3 #c5 #c8 #f6 [A] One hundred years lived in prison (4)
```
Note that this technique can be used to create 3-d (or 4-d!) puzzles. Use a
nodir section for the third dimension, explicitly specifying the cells for
each clue along the third dimension.

### Jigsaw puzzle clues
If there is any nodir clue without cells explicitly specified, then the
clue is shown with a text entry area next to it. Solvers can record their
solutions here, until they figure out where in the grid those letters should
be entered. Solvers can transfer recorded letters from these placeholder areas
by simply clicking the "copy-placeholder" button (that looks like [⇲]) next to
the placeholder area, whenever they have some squares highlighted for entry in
the grid.

The same placeholder text and the copy-placeholder button ([⇲]) are also shown
in the highlighted scrollable 'orphan' clues widget, whenever the currently
highlighed squares do not have a known clue association.

The copy-placeholder button feature does not get activated if there are any
diagramless cells (as only one diagramless is active generally).

The copy-placeholder buttons can be disabled (i.e., not shown at all) by
specifying the exolve-option, hide-copy-placeholder-buttons. This is useful if
you find the buttons distracting in appearance, or if copying from the
placeholder is not very useful for some other reason (for eg., lights are split
into parts).

## exolve-explanations
In a grid that includes solutions, the setter may provide additional notes,
explanations, commentary, etc., in an exolve-explanations section. Just like the
exolve-prelude section, this section also has multiple lines, and these lines
can include html tags. The contents get revealed when the solver clicks on
"Reveal all".
```
  exolve-explanations:
    This puzzle's hidden message was driven by occasional hiccups in
    some <i>noted</i> interactive solvers.
```

## exolve-nina
If a setter has included ninas in the grid, and if they are putting up a version
that has solutions included, they can also specify where the ninas are, and in
that case, a "Show ninas" control button will get displayed. Each nina should
use its own "exolve-nina:" line, and the ninas will get displayed in different
colours upon clicking "Show ninas" (as well as "Reveal all").

The squares involved in a nina are specified in the same chessboard notation
described above. Example:
```
  exolve-nina: j5 j7 j9 j11 j13
  exolve-nina: a7 b7 c7 d7 e7
```
This example is from a puzzle with two ninas. The first one is in the 10th
column ("j"), and the second one is in the seventh row from the bottom.

You can also have ninas that involve arbitrary letters/words from within the
text of the clues or the prelude. This involves a little bit of html.
Just enclose the text that you want to highlight as a nina in a "span" tag,
giving it a unique class name, and specify that class name in the exolve-nina
(the name cannot be a letter followed by a number, so that it is not confused
with the above chessboard notation).
For example:
```
  exolve-nina: acrostic-1
  exolve-across
    1 <span class="acrostic-1">W</span>herefore? (3)
    2 <span class="acrostic-1">O</span>pen borders working (2)
    2 <span class="acrostic-1">W</span>indow (8)
```
Span-class-specified and square-location-specified ninas can be intermixed too,
such as:
```
  exolve-nina: a4 c4 clue-nina
```

## exolve-colour, exolve-color
Specific cells in the grid may be coloured using this feature. The squares
involved are again specified in the chessboard notation.
```
  exolve-colour: palegreen j5 j7 j9 j11 j13
```
The colour itself can be any valid
[HTML colour name](https://www.w3schools.com/colors/colors_names.asp).

## exolve-question
Often, the setter might have hidden additional information for the solver to
discover (such as ninas), or may simply want to survey solvers about something
(such as their favourite clues). The exolve-question section can be used to
do this. Example:
```
  exolve-question: What is the nina that begins with S?
  exolve-question: What is the nina that requests people to find a famous TV series? (3,4) GET LOST
  exolve-question: Your name (30)*
```
In this example, there are three questions. An answer has also been provided for
the second question. The part following the enum ("(3,4)"), if there is an
enum, is treated as the answer (see the exolve-across/across-down section for
details on enums). The answer is not shown in the displayed question. When the
solver clicks "Reveal all", answers to all questions for which answers have
been provided do get revealed.

If an enum in an exolve-question is immediately followed by an asterisk (like
"(30)*" above—note that there is no space before the asterisk), then the enum
is not displayed to the solver; it is only used to determine the size of the
answer box to show.

If the setter has created an exolve-submit section (see below), then answers to
each exolve-question are also sent to the submit URL (see below for details).

## exolve-submit
Setters/publishers can use the exolve-submit section to receive submissions
from solvers. The format is easily seen from this example:
```
  exolve-submit: https://something k k1 k2
```
The first parameter is the URL. The second parameter k is the key for the
letters entered in the grid. The letters are all strung together, row by row.
Dots for blocked squares are also included. In a diagramless square, if the
solver has proposed placing a block, then it is represented by "1" in the
solution string. Consider this grid-fill:
```
  ACE
  R.R
  EAR
```
When submitting, the solution letters will be sent as the string "ACER.REAR" for
this example.

Subsqeuent parameters (k1, k2) are the keys for any questions posed using
exolve-question sections. So, for this example, if the answers entered for the
exolve-questions are ANSWER1, ANSWER2, respectively, then the full URL for
submission will be:
```
  https://something&k=ACER.REAR&k1=ANSWER1&k2=ANSWER2
``` 

The submission is made using HTTP GET. All answers are converted to upper case
for submission.

One easy way to set up submissions is to create a Google Form with one Google
Form question for the solution letters, and one Google Form question for each
exolve-question (using "Short answer" as the question type in each case). Then
the "Get prefilled link" option can be used to get a URL with all the needed
keys.

## exolve-option
In this single-line, repeatable section, the setter can specify certain options.
The list of currently supported options is as follows:
- **hide-inferred-numbers** If this option is specified, then the software does
  not display any clue numbers that were automatically inferred. Setters using
  non-numeric clue labels may want to specify this option.
- **clues-panel-lines:&lt;N&gt;** Limit the across/down/nodir clues boxes to
  about N lines of text, adding scrollbars if needed.
- **offset-top:&lt;N&gt;** Draw the grid with this much space above and under
  it (N pixels). Useful for drawing additional art around the grid using
  customizePuzzle(), for example.
- **offset-left:&lt;N&gt;** Draw the grid with this much space to the left and
  to the right (N pixels). Useful for drawing additional art around the grid
  using customizePuzzle(), for example.
- **grid-background:&lt;C&gt;** Set the colour of the black cells to C, which
  should be a valid HTML colour name/code.
- **allow-digits** If this option is specified, then we allow solvers to enter
  digits in cells.
- **hide-copy-placeholder-buttons** This is an option that is only applicable
  when there are nodir clues without cells explicitly specified. It turns off
  the display of buttons to copy placeholder texts in those cases (see the
  subsection below on "Jigsaw puzzle clues".

## Saving state
The software automatically saves state. It does so in the URL (after the #)
and also in a cookie, using the id specified in the exolve-id section as the
key. The cookie is retained for 90 days after the last change.

Because of limits on cookie size and number of cookies, the state for some
grid that was saved in a cookie may disappear if the solver opens lots of
other grids from the same site, Such sites should encourage solvers to save
or bookmark the URL (which also has the state) and/or implement server-side
state saving.

## Customizations
Setters can customize their grids by directly making changes to the Exolve
files outside of the puzzle specs area. However, this may get hard to maintain
over time, as Exolve goes through new versions. A conservative option is to
simply not update the HTML part of your puzzle: I do try to make sure that all
Exolve Javascript/CSS changes are backwards compatible (so, for example, I do
not change element IDs in the html, and for newly introduced IDs, the
Javascript code checks first that such an element exists).

The recommended way to customize is to load separate, additional Javascript
and/or CSS files. Exolve provides a Javascript hook to do any custom
initialization and/or to modify the html using Javascript. If the setter has
defined a function called `customizePuzzle()`, then it gets called after
Exolve has finished with its own set-up. For example, the following code,
if added within the &lt;script&gt; tag or loaded from a script file, will
customize the html by inserting the italicized red text *New!* after the
Tools link:
```
  function customizePuzzle() {
    let toolsElement = document.getElementById('show-control-keys')
    if (!toolsElement) {
      return
    }
    toolsElement.insertAdjacentHTML(
        'afterend', '<span style="color:red;font-style:italic">New!</span>')
  }
```

It will be easier to keep your files synced up to the latest Exolve version
with these recommendations for customizations.

## Frequently Asked Questions

**We are an established newspaper. Our readers have complained in various ways
about our online interactive crossword. Can we use your code?**

See below (same answer).

**We are a small newsletter and we occasionally feature a crossword. Our
readers have asked for an online interactive solver. Can we use your code?**

Yes. The software is free, and is released under the rather permissive MIT
License.

**Which files should I use? exolve.html or exolve-m.html, exolve-m.css, exolve-m.js?**

I want to maintain a released version in the simple state of a single,
self-contained HTML file containing all the CSS and all the Javascript it needs.
Vanilla Javascript, nothing to import, no scripts to run, absolutely zero
dependencies. If you have just one or two puzzles that you want to render,
and/or you do not have much experience with HTML, then use this file.

If you are serving multiple puzzles, use one copy each of exolve-m.css and
exolve-m.js, and create one copy of exolve-m.html for each puzzle (renaming
it suitably).

