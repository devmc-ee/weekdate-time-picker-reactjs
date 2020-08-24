import React, {useEffect, useRef, useState} from 'react';
import moment from 'moment';
import {ChevronLeft, ChevronRight} from '@material-ui/icons';
import {IconButton, Button} from "@material-ui/core";
import TimePicker from './TimePicker'
import {CALENDAR_SETTINGS} from '../../DATA';
import 'moment/locale/et';
import 'moment/locale/ru';
import {useFormikContext} from "formik";
import {getTimeSlots, getTotalDuration, groupTimeSlots} from "../../utils";
import './Calendar.css';

const Calendar = () => {
	const context = useFormikContext();
	const {maxAvailableDays, disabledWeekDays, locale, dateFormat} = CALENDAR_SETTINGS;
	moment.locale(locale);
	const mMaxAllowedDate = moment().add(maxAvailableDays, 'd');

	const [firstWeekDate, setFirstWeekDate] = useState(moment().format(dateFormat));
	const [selectedDate, setSelectedDate] = useState(moment().format(dateFormat));
	const [expanded, setExpanded] = useState('panel0');//accordion
	const disabledDates = useRef(CALENDAR_SETTINGS.disabledDates || []);

	let [calendarDays, setCalendarDays] = useState([]);
	let emptyTimeSlotGroups = [];
	const {services} = context.values || [];
	const servicesTotalLength = getTotalDuration(services);

	const timeSlots = getTimeSlots(
		selectedDate,
		[],//supposed to be fetched from backend in future
		servicesTotalLength,
		CALENDAR_SETTINGS);
	const groupedTimeSlots = groupTimeSlots(timeSlots, CALENDAR_SETTINGS.timeSlotGroups);

	useEffect(() => {
		expanded && // if panel  is not closed then check the timeslots
		groupedTimeSlots.map((group, i) => {
			const expandedPanelNum = parseInt(expanded.substr(5));
			if (group.length === 0) {
				emptyTimeSlotGroups.push(i);
				if (expandedPanelNum === i
					&& i <= groupedTimeSlots.length) {
					//expand next not empty group of timeslots
					return setExpanded(() => 'panel' + (expandedPanelNum + 1));
				}
			}
			return null;
		});
	}, [expanded, groupedTimeSlots, emptyTimeSlotGroups]);

	//generate calendar days with properties
	useEffect(() => {
		let calendarDays = [];
		let isDisabledDay = false;
		let isSelectedDay = false;
		let isSelectedDisabledDay = false;

		if (!disabledDates.current.includes(selectedDate)
			&& emptyTimeSlotGroups.length === CALENDAR_SETTINGS.timeSlotGroups.length) {
			disabledDates.current = [...disabledDates.current, selectedDate];
		}
		const mCalendarDay = moment(firstWeekDate, dateFormat);

		for (let i = 0; i < 7; i++) {
			isDisabledDay = mCalendarDay.isSameOrAfter(moment().add(maxAvailableDays, 'd'))
				|| disabledWeekDays.includes(mCalendarDay.day())
				|| disabledDates.current.includes(mCalendarDay.format(dateFormat));

			isSelectedDay = mCalendarDay.isSame(moment(selectedDate, dateFormat));

			if (isSelectedDay) {
				isSelectedDisabledDay = isDisabledDay = isDisabledDay || timeSlots.length === 0;
			}
			if (isSelectedDisabledDay) {
				setSelectedDate(moment(selectedDate).add(1, 'd').format(dateFormat));
				setExpanded(() => 'panel' + 0);
			}
			calendarDays.push({
				weekday: mCalendarDay.format('ddd'),
				date: mCalendarDay.format('D'),
				fullDate: mCalendarDay.format(dateFormat),
				disabled: isDisabledDay,
				selected: isSelectedDay
			});
			mCalendarDay.add(1, "d");
		}
		setCalendarDays(calendarDays);

	}, [firstWeekDate,
		selectedDate,
		disabledWeekDays,
		maxAvailableDays,
		timeSlots.length,
		emptyTimeSlotGroups.length,
		dateFormat]);

	const handleRightClick = () => {
		setFirstWeekDate(moment(firstWeekDate).add(7, 'd').format(dateFormat));
	};

	const handleLeftClick = () => {
		setFirstWeekDate(moment(firstWeekDate).subtract(7, 'd'));
	};

	const handleSelect = date => () => {
		const appointment = {
			appointment: {
				date: date,
				time: ''
			}
		};

		setSelectedDate(date);
		context.setValues({...context.values, ...appointment});
		setExpanded('panel0');
	};
	//console.log('render');
	return (
		<>
			<div className="calendar-month-year">
				{moment(firstWeekDate).format('MMMM, Y')}

			</div>

			<div className="calendar-week">
				<IconButton
					className="calendar-btn-left"
					disabled={moment(firstWeekDate, dateFormat).isSameOrBefore(moment())}
					onClick={handleLeftClick}><ChevronLeft/></IconButton>
				<div className="calendar-weekdays">

					{calendarDays.map((day, i) => (
							<div key={i} className="calendar-day">
								<div className="calendar-weekday-name">
									{day.weekday}
								</div>
								<div className="calendar-date">
									<Button
										className="calendar-date-btn" onClick={handleSelect(day.fullDate)}
										variant={day.selected ? 'contained' : 'text'}
										color={day.selected ? 'primary' : 'default'}
										disabled={day.disabled}>{day.date}</Button>
								</div>
							</div>
						)
					)}
				</div>

				<IconButton
					className="calendar-btn-right"
					disabled={moment(firstWeekDate, dateFormat)
						.add(7, 'd').isSameOrAfter(mMaxAllowedDate)}
					onClick={handleRightClick}><ChevronRight/></IconButton>
			</div>
			<div className="calendar-available-times">
				{(timeSlots.length !== 0) &&
				<TimePicker
					selectedDate={selectedDate} expanded={expanded} setExpanded={setExpanded}
					groupedTimeSlots={groupedTimeSlots}/>
				}

			</div>
		</>
	)
};
export default Calendar;
