export const privacyPolicyPopupData = {
    title: "UPLOAD_EVIDENCES",
    message1: "TERMS_AND_CONDITIONS_MSG_1",
    message2: "CONTENT_POLICY",
    message3: "TERMS_AND_CONDITIONS_MSG_2",
    button1: "DO_NOT_UPLOAD",
    button2: "UPLOAD"
}

export const shareProjectPopupData = {
    title: "SHARE_PROJECT_DETAILS",
    message1: "SHARE_PROJECT_DETAILS_MSG1",
    message2: "TERMS_AND_CONTENT_POLICY",
    message3: "SHARE_PROJECT_DETAILS_MSG2",
    button1: "DO_NOT_SHARE",
    button2: "SHARE"
}


    export const CATEGORIES = [
        {
            "label": "Teachers",
            "value": "5fcfa9a2457d6055e33843ef",
            "labelTranslations": "{\"en\":\"Teachers\",\"hi\":\"शिक्षकों की\"}",
            "name": "Teachers"
          },
          {
            "label": "Students",
            "value": "5fcfa9a2457d6055e33843f0",
            "labelTranslations": "{\"en\":\"Students\"}",
            "name": "Students"
          },
          {
            "label": "Infrastructure",
            "value": "5fcfa9a2457d6055e33843f1",
            "labelTranslations": "{\"en\":\"Infrastructure\"}",
            "name": "Infrastructure"
          },
          {
            "label": "Community",
            "value": "5fcfa9a2457d6055e33843f2",
            "labelTranslations": "{\"en\":\"Community\"}",
            "name": "Community"
          },
          {
            "label": "Education Leader",
            "value": "5fcfa9a2457d6055e33843f3",
            "labelTranslations": "{\"en\":\"Education Leader\"}",
            "name": "Education Leader"
          },
          {
            "label": "School Process",
            "value": "5fcfa9a2457d6055e33843f4",
            "labelTranslations": "{\"en\":\"School Process\"}",
            "name": "School Process"
          }

        ]

        export const learningResourceOptions = [
            {
            name: 'All',
            icon: '',
            value: [],
          },
        /*   {
            name: 'Audios',
            icon: '',
            value: ['audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/mpeg', 'audio/ogg'],
          }, */
          {
            name: 'Documents',
            icon: 'insert_drive_file',
            value: ['application/pdf', 'application/epub'],
          },
          {
            name: 'video',
            icon: 'play_circle_outline',
            value: ['video/mp4', 'video/x-youtube', 'video/webm', 'video/3gpp', 'video/mpeg', 'video/quicktime'],
          },
          {
            name: 'interactive',
            icon: 'touch_app',
            value: [
              'application/vnd.ekstep.ecml-archive',
              'application/vnd.ekstep.h5p-archive',
              'application/vnd.ekstep.html-archive',
              'application/vnd.ekstep.content-archive',
            ],
          },
        ]


        export const dialogData = {

          program : {
            type: 'program',
            title: 'SELECT_PROGRAM',
            searchPlaceholder: 'SEARCH_PROGRAM',
            isMultiSelect: false,
            inputDailog: true,
            showFilters: false,
              inputDialogConfig: {
                dialogtitle: 'CREATE_NEW_PROGRAM',
                header: 'CREATE_PROGRAM',
                label: 'ENTER_PROGRAM_NAME',
                placeholder:'PROGRAM_NAME',
                required: true,
                showCancel: true,
                buttonText: { ok: 'SAVE', cancel: 'CANCEL' },
                width: '450px'
              },
              addButton:"ADD_PROGRAM"
            },
            entity: {
                type: 'entity',
                title: 'SELECT_ENTITY',
                filtersTitle:"FILTERS",
                searchPlaceholder:"SEARCH_ENTITY",
                isMultiSelect: false,
                inputDailog: false,
                showFilters: true,
                addButton:"ADD_ENTITY"
              },
              learningResource:{
                type: 'learningResource',
                title: 'SELECT_LEARNING_RESOURCE',
                filtersTitle:"FILTERS",
                searchPlaceholder:"SEARCH_LEARNING_RESOURCE",
                isMultiSelect: true,
                inputDailog: false,
                showFilters: true,
                addButton:"ADD_LEARNING_RESOURCE"
              }
        }

        export const learningResourcePayloadRequest = {
            fields:{
              mode: "hard",
              exists: [],
              facets: [],
              sort_by: {},
            },
            filters: {
              audience: [],
              objectType: ["Content", "QuestionSet"],
              contentType: ["Resource"],
              primaryCategory: [],
              se_mediums: [],
              se_boards: [],
              language: [],
              topic: [],
              purpose: [],
              channel: [],
              subject: []
            }
          }

