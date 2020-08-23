import React, {useState} from 'react';
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
	const [expanded, setExpanded] = useState('panel0');


	let calendarDays = [];
	let disabledDay, selectedDay;
	const servicesTotalLength = getTotalDuration(services);
	const timeSlots = getTimeSlots(
		selectedDate,
		[],
		servicesTotalLength,
		CALENDAR_SETTINGS);
	const groupedTimeSlots = groupTimeSlots(timeSlots, CALENDAR_SETTINGS.timeSlotGroups);

	//generate calendar days with properties
	for (let i = calendarDate; i < calendarDate + 7; i++) {
		disabledDay = (Math.abs(moment().date() - i + 1) >= maxAvailableDays);
		disabledDay = disabledDay || disabledWeekDays.includes(moment().date(i).day());

		selectedDay = moment(moment().date(i).format('YYYY-MM-DD')).isSame(moment(selectedDate));
		if (selectedDay) {
			disabledDay = disabledDay || timeSlots.length === 0;
		}

		calendarDays.push({
			weekday: moment().date(i).format('ddd'),
			date: moment().date(i).format('D'),
			fullDate: moment().date(i).format('YYYY-MM-DD'),
			disabled: disabledDay,
			selected: selectedDay
		})

	}

	const handleRightClick = () => {
		if (maxAvailableDays > calendarDate)
			setCalendarDate(prevDate => prevDate + 7);

	};
	const handleLeftClick = () => {
		if (moment().date() < calendarDate)
			setCalendarDate(prevDate => prevDate - 7);

	};
	const handleSelect = date => event => {
		const appointment = {
			appointment: {
				date: date,
				time: ''
			}
		}
		setSelectedDate(date);
		context.setValues({...context.values, ...appointment})
		setExpanded('panel0');

	}

	return (
		<>
			<div className="calendar-month-year">
				{moment().date(calendarDate).format('MMMM, Y')}
			</div>
			<div className="calendar-week">
				<IconButton
					className="calendar-btn-left" disabled={calendarDate === moment().date() ? true : false}
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
					className="calendar-btn-right" disabled={calendarDate > maxAvailableDays ? true : false}
					onClick={handleRightClick}><ChevronRight/></IconButton>
			</div>
			<div className="calendar-available-times">
				<TimePicker
					selectedDate={selectedDate} expanded={expanded} setExpanded={setExpanded}
					groupedTimeSlots={groupedTimeSlots}/>
			</div>


		</>
	)
});
export default Calendar;
