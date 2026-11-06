// Klementine's five faces (two ink eyes and a mouth), copied from klementine.code
// (src/lib/shell/face-paths.ts, Simon Lund): idle, listening, working, needs (you), done, on the
// site's geometry (viewBox 115 135 170 140). When a face changes there, copy it here.

/** Her five states, one face each (the phone's rule 5). */
export const FACE_LOOKS = ['idle', 'listening', 'working', 'needs', 'done'] as const;
export type FaceLook = (typeof FACE_LOOKS)[number];

/** The SVG groups of each face, in the viewBox `FACE_VIEWBOX`. */
export const FACE_PATHS: Record<FaceLook, string> = {
	idle: '<g transform="translate(0 0) rotate(0 200 215)"><path d="M -3.24 -22 L 3.24 -22 Q 18.36 -22 18.36 -6.88 L 18.36 15.2 Q 18.36 22 11.56 14.03 Q 0 3.57 -11.56 14.03 Q -18.36 22 -18.36 15.2 L -18.36 -6.88 Q -18.36 -22 -3.24 -22 Z" transform="translate(164 190) rotate(0)" fill="currentColor"/><path d="M -3.24 -22 L 3.24 -22 Q 18.36 -22 18.36 -6.88 L 18.36 15.2 Q 18.36 22 11.56 14.03 Q 0 3.57 -11.56 14.03 Q -18.36 22 -18.36 15.2 L -18.36 -6.88 Q -18.36 -22 -3.24 -22 Z" transform="translate(236 190) rotate(0)" fill="currentColor"/><path d="M -14.3 0 Q 0 11.44 14.3 0" transform="translate(200 240)" stroke-width="9" fill="none" stroke="currentColor" stroke-linecap="round"/></g>',
	listening:
		'<g transform="translate(0 0) rotate(0 200 215)"><path d="M -3.03 -23.32 L 3.03 -23.32 Q 17.16 -23.32 17.16 -9.19 L 17.16 10.12 Q 17.16 23.32 3.96 21.73 Q 0 21.55 -3.96 21.73 Q -17.16 23.32 -17.16 10.12 L -17.16 -9.19 Q -17.16 -23.32 -3.03 -23.32 Z" transform="translate(164 188) rotate(0)" fill="currentColor"/><path d="M -3.03 -23.32 L 3.03 -23.32 Q 17.16 -23.32 17.16 -9.19 L 17.16 10.12 Q 17.16 23.32 3.96 21.73 Q 0 21.55 -3.96 21.73 Q -17.16 23.32 -17.16 10.12 L -17.16 -9.19 Q -17.16 -23.32 -3.03 -23.32 Z" transform="translate(236 188) rotate(0)" fill="currentColor"/><path d="M -10.43 0 Q 0 5.84 10.43 0" transform="translate(200 240)" stroke-width="9" fill="none" stroke="currentColor" stroke-linecap="round"/></g>',
	working:
		'<g transform="translate(6 -4) rotate(0 200 215)"><path d="M -3 -22 L 3 -22 Q 17 -22 17 -8 L 17 8 Q 17 22 3 22 Q 0 22 -3 22 Q -17 22 -17 8 L -17 -8 Q -17 -22 -3 -22 Z" transform="translate(167.6 186.4) rotate(0)" fill="currentColor"/><path d="M -3 -22 L 3 -22 Q 17 -22 17 -8 L 17 8 Q 17 22 3 22 Q 0 22 -3 22 Q -17 22 -17 8 L -17 -8 Q -17 -22 -3 -22 Z" transform="translate(239.6 186.4) rotate(0)" fill="currentColor"/><path d="M -5.88 0 Q 0 0.24 5.88 0" transform="translate(200 240)" stroke-width="9" fill="none" stroke="currentColor" stroke-linecap="round"/></g>',
	needs:
		'<g transform="translate(0 0) rotate(6 200 215)"><path d="M -3.05 -22.12 L 3.05 -22.12 Q 18.29 -22.12 18.29 -6.88 L 18.29 8.56 Q 18.29 22.12 4.72 19.64 Q 0 19.29 -4.72 19.64 Q -18.29 22.12 -18.29 8.56 L -18.29 -6.88 Q -18.29 -22.12 -3.05 -22.12 Z" transform="translate(164 194.4) rotate(1.2)" fill="currentColor"/><path d="M -3.05 -25.6 L 3.05 -25.6 Q 18.29 -25.6 18.29 -10.36 L 18.29 12.04 Q 18.29 25.6 4.72 22.73 Q 0 22.32 -4.72 22.73 Q -18.29 25.6 -18.29 12.04 L -18.29 -10.36 Q -18.29 -25.6 -3.05 -25.6 Z" transform="translate(236 192) rotate(1.2)" fill="currentColor"/><path d="M -8.07 0 Q 0 2.26 8.07 0" transform="translate(200 240)" stroke-width="9" fill="none" stroke="currentColor" stroke-linecap="round"/></g>',
	done: '<g transform="translate(0 0) rotate(0 200 215)"><path d="M -3.24 -22 L 3.24 -22 Q 18.36 -22 18.36 -6.88 L 18.36 15.2 Q 18.36 22 11.56 14.03 Q 0 3.57 -11.56 14.03 Q -18.36 22 -18.36 15.2 L -18.36 -6.88 Q -18.36 -22 -3.24 -22 Z" transform="translate(164 190) rotate(0)" fill="currentColor"/><path d="M -3.24 -22 L 3.24 -22 Q 18.36 -22 18.36 -6.88 L 18.36 15.2 Q 18.36 22 11.56 14.03 Q 0 3.57 -11.56 14.03 Q -18.36 22 -18.36 15.2 L -18.36 -6.88 Q -18.36 -22 -3.24 -22 Z" transform="translate(236 190) rotate(0)" fill="currentColor"/><path d="M -18.59 0 Q 0 14.87 18.59 0" transform="translate(200 240)" stroke-width="9" fill="none" stroke="currentColor" stroke-linecap="round"/></g>'
};

export const FACE_VIEWBOX = '115 135 170 140';
