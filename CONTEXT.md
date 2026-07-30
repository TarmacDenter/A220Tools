# A220Tools

A220Tools is a cockpit helper for quick wind-related cross-checks. It presents operational reference information without becoming an approved aircraft performance or dispatch calculation source.

## Language

**RCAM Reference**:
A quick-reference view that relates runway condition, phase of flight, runway heading, and wind direction to pilot-facing wind velocity guidance.
_Avoid_: RCAM calculator, performance calculator, limitation calculator

**Published Wind**:
The wind direction and velocity available to the pilot from METAR, ATIS, AWOS, or manual entry at the time of the check.
_Avoid_: Actual wind, official wind

**Reference Wind**:
The wind used to center or seed an RCAM reference, coming from live METAR data or direct pilot entry.
_Avoid_: Actual wind, starting wind

**Shared Wind Source**:
The single live or manual wind input used by all phase cards, so each phase interprets the same reference wind through its own limits.
_Avoid_: Per-card wind, phase-specific weather

**Shared Runway Heading**:
The runway magnetic heading used by takeoff and landing phase cards to calculate runway-relative wind components.
_Avoid_: Per-card runway, aircraft heading

**Runway Setup**:
The takeoff and landing controls for shared runway magnetic heading and selected RCAM code, shown only when a runway-centered phase is selected.
_Avoid_: Engine-start setup, global setup

**Reported Wind**:
A wind direction and velocity heard from ATC or another current operational source and compared against the RCAM reference.
_Avoid_: New wind, radio wind

**Phase of Flight**:
Whether the RCAM reference is being evaluated for takeoff or landing.
_Avoid_: Operation type, mode

**Phase Card**:
A phase-specific limitation view for engine start, takeoff, or landing that presents only the inputs and reference output relevant to that phase.
_Avoid_: Generic limitation panel, all-in-one matrix

**Selected Phase Card**:
The single phase card currently shown by the phase selector.
_Avoid_: Multi-card dashboard, all phases view

**Default Phase**:
The phase selected when the app opens; Engine Start is the default so the existing engine-start workflow remains immediately available.
_Avoid_: Initial tab, home mode

**Start Phase**:
The phase-selector label for the engine-start limitation workflow.
_Avoid_: Engine Start tab, start mode

**Start Content**:
The existing engine-start compass, readout, assumptions, and heading table behavior preserved under the Start phase.
_Avoid_: Rebuilt start workflow, replacement start card

**Tower Wind Matrix**:
A runway-centered takeoff or landing reference table that shows the maximum wind speed for nearby absolute wind directions and the limiting component for each row.
_Avoid_: Landing wind matrix, heading table, taxi heading table

**RCAM Limit Table**:
A build-time reference table of runway condition codes 1 through 6 and their takeoff and landing crosswind component limits.
_Avoid_: Pilot-entered matrix, certified performance table

**Phase Tailwind Limit**:
The build-time takeoff or landing tailwind component limit used with the selected RCAM crosswind limit to generate the Tower Wind Matrix.
_Avoid_: Shared tailwind limit, RCAM tailwind value

**Takeoff Tailwind Limit**:
The takeoff tailwind component limit for the Tower Wind Matrix; currently 10 kt.
_Avoid_: Start tailwind limit

**Landing Tailwind Limit**:
The landing tailwind component limit for the Tower Wind Matrix; currently 10 kt.
_Avoid_: Start tailwind limit

**Selected RCAM Code**:
The single runway condition code selected for the current runway, shared by takeoff and landing phase cards.
_Avoid_: Takeoff RCAM, landing RCAM

**Absolute Wind Direction**:
A wind direction shown as a published magnetic direction, so pilots can compare the table directly against current ATIS, AWOS, METAR, or manual wind reports.
_Avoid_: Relative offset, runway-relative direction

**Magnetic Wind Reference**:
The pilot-facing wind direction used by RCAM phase cards after converting live METAR true wind to magnetic or accepting manual magnetic input.
_Avoid_: True matrix direction, raw METAR direction

**Display Wind Cap**:
The maximum wind value shown in a wind matrix before switching to a greater-than display such as `>99 kt`.
_Avoid_: Calculation limit, operational limit

**Limit Line**:
A concise phase-card summary of the active crosswind and tailwind limits for the selected phase and RCAM code.
_Avoid_: Verdict banner, current-wind status

**Reference Row**:
The wind matrix row nearest to the current reference wind direction, highlighted so the pilot can orient from the latest METAR or manual wind.
_Avoid_: Current-wind verdict, selected row

**Centered Matrix Window**:
The seven visible absolute-direction rows centered on the shared wind source, selected from a complete set of generated wind direction values.
_Avoid_: Partial calculation, limited model

**Runway-Centered Fallback**:
The default centered matrix window for calm or variable reference winds, using the shared runway heading when no usable wind direction exists.
_Avoid_: Missing matrix, blocked matrix

**Limiting Component**:
The wind component, crosswind or tailwind, that determines the maximum wind velocity for a matrix row.
_Avoid_: Failure reason, unsafe reason

**Reference Wind Components**:
The crosswind and tailwind components of the current fetched or manually entered wind against the shared runway heading.
_Avoid_: Matrix row components, generated components

**Limit Proximity**:
A visual warning state applied to reference wind components when either component reaches at least 80 percent of its active maximum limit.
_Avoid_: Matrix row warning, generated row color
