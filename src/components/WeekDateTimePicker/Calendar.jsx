import React, {useRef, useState} from 'react';
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

const Calendar = React.memo(() => {

	const context = useFormikContext();
	const services = context.values.services || [];
	const {maxAvailableDays, disabledWeekDays, locale} = CALENDAR_SETTINGS;

	moment.locale(locale);
	const [calendarDate, setCalendarDate] = useState(moment().date());
	const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
	const [expanded, setExpanded] = useState('panel0');//accordion
	const disabledDates = useRef(CALENDAR_SETTINGS.disabledDates);

	let calendarDays = [];
	let emptyTimeSlotGroups = [];
	let isDisabledDay, isSelectedDay, isSelectedDisabledDay;
	const servicesTotalLength = getTotalDuration(services);
	const timeSlots = getTimeSlots(
		selectedDate,
		[],
		servicesTotalLength,
		CALENDAR_SETTINGS);
	const groupedTimeSlots = groupTimeSlots(timeSlots, CALENDAR_SETTINGS.timeSlotGroups);

	groupedTimeSlots.map((group, i) => {
		const expandedPanelNum = parseInt(expanded.substr(5));
		if (group.length === 0) {
			emptyTimeSlotGroups.push(i);
		}
		if (group.length === 0 && expandedPanelNum === i && i <= groupedTimeSlots.length) {
			//expand next not empty group of timeslots
			return setExpanded(() => 'panel' + (expandedPanelNum + 1));
		}
		return false;
	});

	if (!disabledDates.current.includes(selectedDate)
		&& emptyTimeSlotGroups.length === CALENDAR_SETTINGS.timeSlotGroups.length) {
		disabledDates.current = [...disabledDates.current, selectedDate];
	}

	//generate calendar days with properties
	for (let i = calendarDate; i < calendarDate + 7; i++) {
		isDisabledDay = (Math.abs(moment().date() - i + 1) >= maxAvailableDays);
		isDisabledDay = isDisabledDay || disabledWeekDays.includes(moment().date(i).day());
		isDisabledDay = isDisabledDay || disabledDates.current.includes(moment().date(i).format('YYYY-MM-DD'));

		isSelectedDay = moment(moment().date(i).format('YYYY-MM-DD')).isSame(moment(selectedDate));
		isDisabledDay = isDisabledDay || emptyTimeSlotGroups.length === groupedTimeSlots.length;
		if (isSelectedDay) {
			isSelectedDisabledDay = isDisabledDay = isDisabledDay || timeSlots.length === 0;
		}
		if (isSelectedDisabledDay) {
			setSelectedDate(moment(selectedDate).add(1, 'd').format('YYYY-MM-DD'));
			setExpanded(() => 'panel' + 0);
		}
		calendarDays.push({
			weekday: moment().date(i).format('ddd'),
			date: moment().date(i).format('D'),
			fullDate: moment().date(i).format('YYYY-MM-DD'),
			disabled: isDisabledDay,
			selected: isSelectedDay
		});
	}

	const handleRightClick = () => {
		if (maxAvailableDays > calendarDate)
			setCalendarDate(prevDate => prevDate + 7);
	};

	const handleLeftClick = () => {
		if (moment().date() < calendarDate)
			setCalendarDate(prevDate => prevDate - 7);
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

	return (
		<>
			<div className="calendar-month-year">
				{moment().date(calendarDate).format('MMMM, Y')}
			</div>
			<div className="calendar-week">
				<IconButton
					className="calendar-btn-left" disabled={calendarDate === moment().date()}
					onClick={handleLeftClick}><ChevronLeft/></IconButton>
				<div className="calendar-weekdays">

					{calendarDays.map(
						(day, i) => (
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
					className="calendar-btn-right" disabled={calendarDate > maxAvailableDays}
					onClick={handleRightClick}><ChevronRight/></IconButton>
			</div>
			<div className="calendar-available-times">
				{isSelectedDisabledDay
					? 'There is no available times on this date'
					: <TimePicker
						selectedDate={selectedDate} expanded={expanded} setExpanded={setExpanded}
						groupedTimeSlots={groupedTimeSlots}/>
				}
			</div>
		</>
	)
});
export default Calendar;
