/* eslint-disable react/prop-types */
import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import embed, { vega } from 'vega-embed';
import { full_bg, full_pm } from './data';
import iconsSheet from './assets/pokemonicons-sheet.png';
import styles from './speedviewer.module.css';

export default function SpeedViewer({ initPMNames }) {
    var start_list = full_pm.filter((i) => { return initPMNames.includes(i.name) });
    var v1 = InitVega(start_list, 'vis');
    return (
        <div>
            <div style={{ float: 'left', width: '360px' }} >
                <DisplayList vegaObj={v1} pmNames={initPMNames} />
            </div>
            <div id="vis" style={{ minWidth: '700px' }}></div>
        </div>
    );
}

// a pokemon list on the left side
function DisplayList({ vegaObj, pmNames }) {
    //const [dList, setDList] = React.useState(start_list.map((option) => option.name));
    const [dList, setDList] = React.useState(pmNames);
    const handleRemoveItem = (name) => {
        setDList(dList.filter(i => i !== name));
    };

    function gen_random_pm_list(l) {
        let list = [];
        let max_random = full_pm.length
        for (let i = 0; i < l; i++) {
            list.push(full_pm[parseInt(Math.random() * max_random)]);
        }
        return list;
    }

    function style_for_name(pmName, vAlign = 'bottom') {
        let default_style = {
            display: 'inline-block',
            width: '40px',
            height: '30px',
            //'verticalAlign': vAlign,
            'backgroundColor': 'transparent',
            'backgroundImage': `url(${iconsSheet})`,
            'backgroundRepeat': 'no-repeat',
            'backgroundAttachment': 'scroll',
            'backgroundPositionX': '0px',
            'backgroundPositionY': '0px'
        };
        let target = full_bg.find((i) => i.d_name === pmName);
        if (target) {
            default_style['backgroundPositionX'] = target['bg_left'];
            default_style['backgroundPositionY'] = target['bg_top'];
        }
        return default_style;
    };

    function PMChooser() {
        const [value, setValue] = React.useState(null);

        function handleClick() {
            if (value !== null) {
                setDList(dList => [...dList, value]);
                let insertData = vega.changeset().insert(full_pm.find((i) => { return i.name === value }));
                vegaObj.then((res) => { res.view.change('filtered_pms', insertData).run() });
            }
        }

        return (
            <div>
                <div>{ value !== null ? `Press 'Enter' to insert Pokemon: ${value}` : 'Choose a Pokemon from list:'}</div>
                <br/>
                <Autocomplete
                    openOnFocus
                    disableCloseOnSelect
                    autoHighlight
                    //value={value}
                    onChange={(_, newValue) => {setValue(newValue);}}
                    id="pm-choose-input"
                    options={full_pm.map((option) => option.name)}
                    sx={{ width: 300 }}
                    renderOption={(props, option) =>(
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}
                            onDoubleClick={handleClick} >
                            <span style={style_for_name(option, 'baseline')}></span>
                            {option}
                        </Box>
                    )}
                    renderInput={(params) => <TextField {...params} label="Search Pokemon" />}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            // Prevent's default 'Enter' behavior.
                            event.defaultMuiPrevented = true;
                            // your handler code
                            handleClick();
                        }
                    }}
                />
            </div>
        );
    };

    return (
        <div>
            <PMChooser />
            <button onClick={() => vegaObj.then((res) => {
                let rand5 = gen_random_pm_list(5);
                let add_val_list = rand5.map((i) => i.name);
                setDList(dList => [...dList, ...add_val_list]);
                res.view.change('filtered_pms', vega.changeset().insert(rand5)).run();
            })}>Random Insert 5</button>
            <ul className={styles.pmlists}>
                {dList.map((e, i) =>
                    <li key={i}>
                        <button name={e} onClick={(evt) => {
                            let name = evt.target.getAttribute("name");
                            handleRemoveItem(name);
                            let removeData = vega.changeset().remove((i) => { return i.name === name });
                            vegaObj.then((res) => { res.view.change('filtered_pms', removeData).run() });
                        }}>x</button>
                        {e}
                        <span style={style_for_name(e)}></span>
                    </li>
                )}
            </ul>
            <br />
        </div>
    )
}

// Vega part
// init the spec, then call the vega.embed
function InitVega(pmList, visDivID) {
    //let pm_list = full_pm;
    const spec = {
        "config": {
            "view": {
                "width": 600,
                "height": 600, "continuousWidth": 800, "continuousHeight": 400
            }
        },
        "transform": [
            { "calculate": "parseInt(((datum.base_spe*2+0+0/4)*1/2+5)*0.9)", "as": "stats_nnzero" },
            { "calculate": "parseInt(((datum.base_spe*2+31+0/4)*1/2+5)*0.9)", "as": "stats_nniv" },
            { "calculate": "parseInt(((datum.base_spe*2+31+0/4)*1/2+5))", "as": "stats_noev" },
            { "calculate": "parseInt(((datum.base_spe*2+31+252/4)*1/2+5))", "as": "stats_evmax" },
            { "calculate": "parseInt(((datum.base_spe*2+31+0/4)*1/2+5)*1.1)", "as": "stats_npnoev" },
            { "calculate": "parseInt(((datum.base_spe*2+31+252/4)*1/2+5)*1.1)", "as": "stats_nmax" },
            { "calculate": "parseInt(datum.stats_nmax*1.5)", "as": "u1" },
            { "calculate": "parseInt(datum.stats_nmax*2)", "as": "u2" },
            { "calculate": "parseInt(datum.stats_noev*2/3)", "as": "d1" },
            { "calculate": "parseInt(datum.stats_noev/2)", "as": "d2" },
        ],
        "vconcat": [
            {
                "encoding": {
                    "x": {
                        "axis": { "labelAngle": -35, "title": null },
                        "field": "name",
                        "type": "ordinal",
                        "sort": { "field": "base_spe", "order": "ascending" }
                    },
                    "tooltip": [
                        { "title": "NAME", "field": "name" },
                        { "title": "BASE", "field": "base_spe" },
                        { "title": "+2", "field": "u2" },
                        { "title": "+1", "field": "u1" },
                        { "title": "max", "field": "stats_nmax" },
                        { "title": "252ev", "field": "stats_evmax" },
                        { "title": "+nature", "field": "stats_npnoev" },
                        { "title": "v", "field": "stats_noev" },
                        { "title": "-nature", "field": "stats_nniv" },
                        { "title": "min", "field": "stats_nnzero" }
                    ]
                },
                "layer": [
                    {
                        "mark": { "type": "bar", "width": { "band": 0.9 } },
                        "encoding": {
                            "color": { "value": "#40ff40" },
                            "y": {
                                "field": "stats_npnoev",
                                "axis": { "title": "Stats", "grid": true, "titleColor": "#4c78a8" },
                                "type": "quantitative"
                            },
                            "y2": { "field": "stats_nmax" }
                        }
                    },
                    {
                        "mark": { "type": "bar", "width": { "band": 0.6 } },
                        "encoding": {
                            "color": { "value": "#f32030" },
                            "y": { "field": "stats_nnzero", "type": "quantitative" },
                            "y2": { "field": "stats_nniv" }
                        }
                    },
                    {
                        "mark": { "type": "bar", "width": { "band": 0.6 } },
                        "encoding": {
                            "color": { "value": "#4c78a8" },
                            "opacity": { "value": 0.8 },
                            "y": { "field": "stats_noev", "type": "quantitative" },
                            "y2": { "field": "stats_evmax" }
                        }
                    },
                    {
                        "mark": "tick",
                        "encoding": {
                            "color": { "value": "#40ff40" },
                            "y": { "field": "stats_npnoev", "type": "quantitative" }
                        }
                    },

                    {
                        "mark": { "type": "point", "shape": "triangle-up", "strokeWidth": 1.5, "size": 50 },
                        "encoding": {
                            "y": { "field": "u1", "type": "quantitative" }
                        }
                    },
                    {
                        "mark": {
                            "type": "line",
                            "interpolate": "linear",
                            "stroke": "black",
                            "strokeWidth": 1.2
                        },
                        "encoding": {
                            "color": { "value": "#a01afa" },
                            "y": { "field": "base_spe", "type": "quantitative" }
                        }
                    }
                ]
            },
            {
                "height": 40,
                "encoding": {
                    "x": {
                        "axis": null,
                        "field": "name",
                        "type": "ordinal",
                        "sort": { "field": "base_spe", "order": "ascending" }
                    },
                    "tooltip": [
                        { "title": "NAME", "field": "name" },
                        { "title": "Type1", "field": "type1" },
                        { "title": "Type2", "field": "type2" }
                    ]
                },
                "layer": [
                    {
                        "mark": { "type": "rect", "stroke": "black", "strokeWidth": 0.7 },
                        "encoding": {
                            "color": {
                                "field": "type1",
                                "legend": { "title": "Type" },
                                "scale": { "domain": ["Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Other", "Poison", "Psychic", "Rock", "Steel", "Water"], "range": ["#91C02E", "#5A5365", "#0A6DC2", "#F4D23C", "#EB8FE6", "#CD406A", "#FE9C54", "#8EA8DE", "#5269AC", "#62BB5A", "#D87844", "#73CEBF", "#9199A1", "#44685E", "#A96AC8", "#F97178", "#C5B78B", "#5A8DA1", "#4F90D5"] }
                            },
                            "y": { "value": 0 },
                            "y2": { "value": 20 }
                        }
                    },
                    {
                        "mark": { "type": "rect", "stroke": "black", "strokeWidth": 0.7 },
                        "transform": [{ "filter": "isValid(datum.type2)" }],
                        "encoding": {
                            "color": { "field": "type2" },
                            "y": { "value": 20 },
                            "y2": { "value": 40 }
                        }
                    }
                ]
            }
        ],
        "data": { "name": "filtered_pms" },
        "$schema": "https://vega.github.io/schema/vega-lite/v5.2.0.json",
        "datasets": {
            "filtered_pms": pmList
        }
    };
    return embed(`#${visDivID}`, spec);
}