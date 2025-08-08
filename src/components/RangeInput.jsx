import { useCallback, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './RangeInput.module.css';

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

const RangeInput = ({
    min,
    max,
    minValue,
    maxValue,
    onChange,
    debounceMs = 50,
    vertical = false,
    size = 'wide',
    flipDisplay = false,
    forceIntegers = false
}) => {
    const rangeRef = useRef(null);

    // Internal state for immediate UI update
    const [internalMin, setInternalMin] = useState(minValue);
    const [internalMax, setInternalMax] = useState(maxValue);

    // Sync internal state when props change (e.g. external updates)
    useEffect(() => {
        setInternalMin(minValue);
        setInternalMax(maxValue);
    }, [minValue, maxValue]);

    // Debounced onChange callback to parent
    const debouncedOnChange = useRef(
        debounce((values) => {
            if (forceIntegers) {
                values.minValue = Math.round(values.minValue);
                values.maxValue = Math.round(values.maxValue);
            }
            onChange(values);
        }, debounceMs)
    ).current;

    const getPercentage = useCallback((value) => ((value - min) / (max - min)) * 100, [min, max]);

    const handleResize = useCallback((newPercentage, isMin) => {
        const clamped = Math.max(0, Math.min(100, newPercentage));
        if (isMin) {
            const limited = Math.min(clamped, getPercentage(internalMax) - 1);
            const newVal = min + ((max - min) * limited) / 100;
            setInternalMin(newVal);
            debouncedOnChange({ minValue: newVal, maxValue: internalMax });
        } else {
            const limited = Math.max(clamped, getPercentage(internalMin) + 1);
            const newVal = min + ((max - min) * limited) / 100;
            setInternalMax(newVal);
            debouncedOnChange({ minValue: internalMin, maxValue: newVal });
        }
    }, [min, max, internalMin, internalMax, debouncedOnChange, getPercentage]);

    const startDrag = useCallback((e, isMin, isTouch) => {
        e.preventDefault();

        const rect = rangeRef.current.getBoundingClientRect();
        const getPos = (ev) => {
            const clientX = isTouch ? ev.touches[0].clientX : ev.clientX;
            const clientY = isTouch ? ev.touches[0].clientY : ev.clientY;
            return vertical ? clientY - rect.top : clientX - rect.left;
        };

        const update = (ev) => {
            ev.preventDefault();
            const pos = getPos(ev);
            const newPercentage = (pos / (vertical ? rect.height : rect.width)) * 100;
            handleResize(newPercentage, isMin);
        };

        const end = () => {
            document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', update);
            document.removeEventListener(isTouch ? 'touchend' : 'mouseup', end);
        };

        document.addEventListener(isTouch ? 'touchmove' : 'mousemove', update, { passive: false });
        document.addEventListener(isTouch ? 'touchend' : 'mouseup', end, { passive: false });

        update(e);
    }, [vertical, handleResize]);

    const minPercentage = getPercentage(internalMin);
    const maxPercentage = getPercentage(internalMax);

    return (
        <section
            ref={rangeRef}
            className={`${styles['custom-range-input']} ${vertical ? styles.vertical : ''} ${flipDisplay ? styles.flipped : ''} ${styles[size]}`}
        >
            <div
                className={styles.bar}
                style={
                    vertical
                        ? { top: `${minPercentage}%`, bottom: `${100 - maxPercentage}%` }
                        : { left: `${minPercentage}%`, right: `${100 - maxPercentage}%` }
                }
            />
            <div
                className={styles.handle}
                style={vertical ? { top: `${minPercentage}%`, width: '100%' } : { left: `${minPercentage}%` }}
                onMouseDown={(e) => startDrag(e, true, false)}
                onTouchStart={(e) => startDrag(e, true, true)}
            />
            <div
                className={styles.handle}
                style={vertical ? { top: `${maxPercentage}%`, width: '100%' } : { left: `${maxPercentage}%` }}
                onMouseDown={(e) => startDrag(e, false, false)}
                onTouchStart={(e) => startDrag(e, false, true)}
            />
        </section>
    );
};

RangeInput.propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    debounceMs: PropTypes.number,
    vertical: PropTypes.bool,
    size: PropTypes.oneOf(['normal', 'wide', 'narrow', 'narrowest']),
    forceIntegers: PropTypes.bool,
    flipDisplay: PropTypes.bool,
};

export default RangeInput;
