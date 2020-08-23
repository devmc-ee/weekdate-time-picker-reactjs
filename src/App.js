import React from 'react';
import {Form, Formik} from 'formik'
import WeekDateTimePicker from './components/WeekDateTimePicker'
import './App.css';

function App() {
	return (
		<div className="App">
			<Formik initialValues={{appointment: ''}} onSubmit={() => console.log('Submit')}>
				{formik => (
					<Form>
						<WeekDateTimePicker/>
					</Form>
				)
				}

			</Formik>
		</div>
	);
}

export default App;
