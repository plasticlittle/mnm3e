const degreeClasses = [
    'four-fail',
    'three-fail',
    'two-fail',
    'one-fail',
    'unused',
    'one-success',
    'two-success',
    'three-success',
    'four-success',
];
export const calculateDegrees = (dc, rolled) => {
    const dcDiff = rolled - dc;
    const degrees = Math.floor(dcDiff / 5) + (dcDiff >= 0 ? 1 : 0);
    return {
        degrees,
        cssClass: degreeClasses[Math.clamped(degrees + 4, 0, degreeClasses.length - 1)],
    };
};
